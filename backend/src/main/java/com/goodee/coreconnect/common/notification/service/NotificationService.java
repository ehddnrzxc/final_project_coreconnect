package com.goodee.coreconnect.common.notification.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * NotificationService - 알림 저장 및 트랜잭션 커밋 이후(후커밋) 실시간 전송 처리
 *
 * 핵심 변경점(요약)
 *  1) DB 저장 직후 즉시 WebSocket 전송하지 않고 TransactionSynchronizationManager에 afterCommit 콜백을 등록하여
 *     트랜잭션이 커밋된 이후에만 webSocketDeliveryService.sendToUser(...) 와 Redis publish를 수행함으로써
 *     DB/메시지의 레이스 컨디션을 제거합니다.
 *  2) Redis publish는 옵션으로 처리(ObjectProvider로 주입). Redis가 있으면 publish 하여 멀티-노드 전파 보장.
 *  3) ObjectMapper는 스프링 빈(전역)에 JavaTimeModule 등록되어 있다고 가정하여 주입받아 사용 (LocalDateTime 직렬화 문제 해결).
 *
 * 적용 전 반드시:
 *  - jackson-datatype-jsr310 의존성 추가 및 ObjectMapper(JavaTimeModule 등록) 빈 구성
 *  - (멀티 노드 필요 시) Redis 의존성 및 RedisConfig 등록
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    // 의존성: 리포지토리 & 서비스
    private final NotificationRepository notificationRepository; // 알림 저장소
    private final UserRepository userRepository;                 // 사용자 조회
    private final WebSocketDeliveryService webSocketDeliveryService; // 로컬 세션으로 전달하는 서비스

    // ObjectMapper: 전역 빈으로 JavaTimeModule 등록된 것을 주입받아 사용
    private final ObjectMapper objectMapper;

    // Redis 템플릿은 Optional 형태로 주입 (환경에 따라 없을 수 있음)
    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;

    /** 
     * 알림 읽음 처리
     */
    public NotificationReadResponseDTO markAsRead(Integer notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        notification.markRead();
        notificationRepository.save(notification);
        return new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
    }

    /**
     * 단일 수신자 알림 저장 + 트랜잭션 커밋 이후 전송
     *
     * 변경 핵심:
     *  - DB에 저장한 뒤 TransactionSynchronizationManager.registerSynchronization(...) 에서
     *    afterCommit() 콜백으로 webSocketDeliveryService.sendToUser 및 Redis publish 를 수행합니다.
     */
    @Transactional
    public void sendNotification(
        Integer recipientId, // 알림 받을 사용자 
        NotificationType type, // 알림 타입 (EMAIL, NOTICE, APPROVAL, SCHEDULE)
        String message, // 알림 메시지
        Integer chatId, // 채팅 알림일때만 (여기선 null 허용)
        Integer roomId, // 채팅 알림일때만 (여기선 null 허용)
        Integer senderId, // 발신자 사용자 ID
        String senderName // 발신자 이름
    ) {
        // 1) 기본 null 방어
        if (recipientId == null) {
            log.warn("[NotificationService] recipientId가 null입니다. 알림 전송 중단.");
            return;
        }
        if (senderId == null) {
            log.warn("[NotificationService] senderId가 null입니다. 알림 전송 중단.");
            return;
        }

        // 2) 수신자/발신자 존재 확인
        User recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new IllegalArgumentException("알림 수신자 없음: " + recipientId));
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("알림 발신자 없음: " + senderId));

        // 3) 비허용되는 chatId/roomId 무시
        if ((type == NotificationType.EMAIL || type == NotificationType.NOTICE 
                || type == NotificationType.APPROVAL || type == NotificationType.SCHEDULE)
                && (chatId != null || roomId != null)) {
            log.warn("[NotificationService] {} 알림에 chatId/roomId가 전달됨 -> 무시", type.name());
            chatId = null;
            roomId = null;
        }

        // 4) DB 저장 (영속성 컨텍스트에 저장)
        Notification notification = Notification.createNotification(
            recipient, type, message, null, null, false, false, false,
            LocalDateTime.now(), null, sender
        );
        notificationRepository.save(notification);

        // 5) 전송 페이로드 준비
        NotificationPayload payload = new NotificationPayload();
        payload.setNotificationId(notification.getId());
        payload.setSenderId(sender.getId());
        payload.setSenderName(sender.getName());
        payload.setRecipientId(recipient.getId());
        payload.setReceiverName(recipient.getName());
        payload.setMessage(notification.getNotificationMessage());
        payload.setNotificationType(type.name());
        payload.setCreatedAt(notification.getNotificationSentAt() != null
            ? notification.getNotificationSentAt()
            : LocalDateTime.now());

        // 6) afterCommit 에서 실제 전송 수행 (로컬 + Redis publish)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // 6.1) 로컬 노드의 세션으로 즉시 전달 시도
                try {
                    webSocketDeliveryService.sendToUser(recipientId, payload);
                } catch (Exception e) {
                    log.warn("[NotificationService][afterCommit] 로컬 전송 실패 recipientId={}: {}", recipientId, e.getMessage(), e);
                }

                // 6.2) Redis가 있으면 publish 하여 다른 노드로 전파
                try {
                    StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
                    if (redisTemplate != null) {
                        String channel = "notifications";
                        String json = objectMapper.writeValueAsString(payload); // objectMapper에 JavaTimeModule 필요
                        redisTemplate.convertAndSend(channel, json);
                    }
                } catch (Exception e) {
                    log.warn("[NotificationService][afterCommit] redis publish 실패 recipientId={}: {}", recipientId, e.getMessage(), e);
                }

                log.info("[NotificationService] 알림 후커밋 전송 완료: recipientId={}, notificationId={}", recipientId, payload.getNotificationId());
            }
        });
    }

    /**
     * 여러 수신자에게 알림 저장 + 트랜잭션 커밋 이후 일괄 전송
     *
     * 변경 핵심:
     *  - 각 수신자별로 Notification 엔티티를 저장한 뒤, afterCommit에서 수집된 payload 목록을 순회하며 전송/퍼블리시합니다.
     */
    @Transactional
    public void sendNotificationToUsers(
        List<Integer> recipientIds,
        NotificationType type,
        String message,
        Integer chatId,
        Integer roomId,
        Integer senderId,
        String senderName
    ) {
        // 1) 기본 방어
        if (senderId == null) {
            log.warn("[NotificationService] senderId가 null입니다. 여러명 알림 중단.");
            return;
        }
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new EntityNotFoundException("알림 발신자 없음: " + senderId));

        if (recipientIds == null || recipientIds.isEmpty()) {
            log.warn("[NotificationService] recipientIds가 비어있습니다. 중단.");
            return;
        }

        // 2) DB 저장 및 payload 수집
        List<NotificationPayload> payloads = new ArrayList<>(recipientIds.size());
        for (Integer rid : recipientIds) {
            if (rid == null) {
                log.warn("[NotificationService] recipientId 리스트에 null 값 존재 - 스킵");
                continue;
            }
            User receiver = userRepository.findById(rid)
                .orElseThrow(() -> new EntityNotFoundException("알림 수신자 없음: " + rid));

            Notification notification = Notification.createNotification(
                receiver, type, message, null, null, false, false, false,
                LocalDateTime.now(), null, sender
            );
            notificationRepository.save(notification);

            NotificationPayload payload = new NotificationPayload();
            payload.setNotificationId(notification.getId());
            payload.setSenderId(sender.getId());
            payload.setSenderName(sender.getName());
            payload.setRecipientId(receiver.getId());
            payload.setReceiverName(receiver.getName());
            payload.setMessage(message);
            payload.setNotificationType(type.name());
            payload.setCreatedAt(notification.getNotificationSentAt());

            payloads.add(payload);
        }

        // 3) afterCommit에서 일괄 전송
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (NotificationPayload p : payloads) {
                    try {
                        webSocketDeliveryService.sendToUser(p.getRecipientId(), p);
                    } catch (Exception e) {
                        log.warn("[NotificationService][afterCommit] local sendToUser 실패 recipientId={}: {}", p.getRecipientId(), e.getMessage(), e);
                    }
                    try {
                        StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
                        if (redisTemplate != null) {
                            String json = objectMapper.writeValueAsString(p);
                            redisTemplate.convertAndSend("notifications", json);
                        }
                    } catch (Exception e) {
                        log.warn("[NotificationService][afterCommit] redis publish 실패 recipientId={}: {}", p.getRecipientId(), e.getMessage(), e);
                    }
                }
                log.info("[NotificationService] sendNotificationToUsers afterCommit 완료: count={}", payloads.size());
            }
        });
    }
}