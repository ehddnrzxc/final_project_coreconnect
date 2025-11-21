package com.goodee.coreconnect.common.notification.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.beans.factory.ObjectProvider;

/**
 * NotificationService - 알림 저장 및 트랜잭션 커밋 이후(후커밋) 실시간 전송 처리 (Redis는 주석)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebSocketDeliveryService webSocketDeliveryService;
    private final ObjectMapper objectMapper;
    //private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;

    public NotificationReadResponseDTO markAsRead(Integer notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        notification.markRead();
        notificationRepository.save(notification);
        return new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
    }

    @Transactional
    public void sendNotification(
        Integer recipientId,
        NotificationType type,
        String message,
        Integer chatId,
        Integer roomId,
        Integer senderId,
        String senderName
    ) {
        if (recipientId == null) {
            log.warn("[NotificationService] recipientId가 null입니다. 알림 전송 중단.");
            return;
        }
        if (senderId == null) {
            log.warn("[NotificationService] senderId가 null입니다. 알림 전송 중단.");
            return;
        }
        User recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new IllegalArgumentException("알림 수신자 없음: " + recipientId));
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("알림 발신자 없음: " + senderId));

        if ((type == NotificationType.EMAIL || type == NotificationType.NOTICE 
                || type == NotificationType.APPROVAL || type == NotificationType.SCHEDULE)
                && (chatId != null || roomId != null)) {
            log.warn("[NotificationService] {} 알림에 chatId/roomId가 전달됨 -> 무시", type.name());
            chatId = null;
            roomId = null;
        }

        Notification notification = Notification.createNotification(
            recipient, type, message, null, null, false, false, false,
            LocalDateTime.now(), null, sender
        );
        notificationRepository.save(notification);

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

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    webSocketDeliveryService.sendToUser(recipientId, payload);
                    
                    // 전송 성공 후 sentYn 업데이트
                    notificationRepository.findById(payload.getNotificationId())
                    .ifPresent(n -> n.markSent(LocalDateTime.now()));
                    
                } catch (Exception e) {
                    log.warn("[NotificationService][afterCommit] 로컬 전송 실패 recipientId={}: {}", recipientId, e.getMessage(), e);
                }
                /*
                try {
                    StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
                    if (redisTemplate != null) {
                        String channel = "notifications";
                        String json = objectMapper.writeValueAsString(payload);
                        redisTemplate.convertAndSend(channel, json);
                    }
                } catch (Exception e) {
                    log.warn("[NotificationService][afterCommit] redis publish 실패 recipientId={}: {}", recipientId, e.getMessage(), e);
                }
                */
                log.info("[NotificationService] 알림 후커밋 전송 완료: recipientId={}, notificationId={}", recipientId, payload.getNotificationId());
            }
        });
    }

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

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (NotificationPayload p : payloads) {
                    try {
                        webSocketDeliveryService.sendToUser(p.getRecipientId(), p);
                        
                        // 전송 성공 후 sentYn 업데이트
                        notificationRepository.findById(p.getNotificationId())
                            .ifPresent(n -> n.markSent(LocalDateTime.now()));
                        
                    } catch (Exception e) {
                        log.warn("[NotificationService][afterCommit] local sendToUser 실패 recipientId={}: {}", p.getRecipientId(), e.getMessage(), e);
                    }
                    /*
                    try {
                        StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
                        if (redisTemplate != null) {
                            String json = objectMapper.writeValueAsString(p);
                            redisTemplate.convertAndSend("notifications", json);
                        }
                    } catch (Exception e) {
                        log.warn("[NotificationService][afterCommit] redis publish 실패 recipientId={}: {}", p.getRecipientId(), e.getMessage(), e);
                    }
                    */
                }
                log.info("[NotificationService] sendNotificationToUsers afterCommit 완료: count={}", payloads.size());
            }
        });
    }
}