package com.goodee.coreconnect.common.notification.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebSocketDeliveryService webSocketDeliveryService;

    /** 
     * 알림 읽음 처리 메서드
     */
    public NotificationReadResponseDTO markAsRead(Integer notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        notification.markRead();
        notificationRepository.save(notification);
        return new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
    }

    /**
     * 알림 저장 + 실시간 WebSocket 푸시 (개선: id null 방어)
     */
    @Transactional
    public void sendNotification(
        Integer recipientId, // 알림 받을 사용자 
        NotificationType type, // 알림 타입 (EMAIL, NOTICE, APPROVAL, SCHEDULE)
        String message, // 알림 메시지
        Integer chatId, // 채팅 알림일때만
        Integer roomId, // 채팅 알림일때만
        Integer senderId, // 발신자 사용자 ID
        String senderName // 발신자 이름
    ) {
        // [1] recipientId null 체크
        if (recipientId == null) {
            log.warn("[NotificationService] recipientId가 null입니다. 알림 전송/저장 중단.");
            return;
        }

        // [2] senderId null일 때도 안전하게 처리
        if (senderId == null) {
            log.warn("[NotificationService] senderId가 null입니다. 알림 전송/저장 중단.");
            return;
        }

        // [3] 알림 수신자/발신자 조회
        User recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new IllegalArgumentException("알림 수신자 없음: " + recipientId));
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("알림 발신자 없음: " + senderId));

        // --- 알림 타입별 chatId/roomId 제한 체킹 ---
        if ((type == NotificationType.EMAIL || type == NotificationType.NOTICE 
            || type == NotificationType.APPROVAL || type == NotificationType.SCHEDULE)
          && (chatId != null || roomId != null)) {
            log.warn("[NotificationService] {} 알림에 chatId/roomId가 값으로 들어왔습니다. 무시합니다.", type.name());
            chatId = null;
            roomId = null;
        }
        
        // DB 저장
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

        webSocketDeliveryService.sendToUser(recipientId, payload);

        log.info("[NotificationService] {} 알림 전송 완료: recipientId={}, type={}, message={}", type, recipientId, type, message);
    }

    /**
     * 여러 사용자에게 알림 전송 (공통, null 방어 추가)
     */
    @Transactional
    public void sendNotificationToUsers(
        List<Integer> recipientIds, // 수신자 목록
        NotificationType type,      // 알림 타입
        String message,             // 메시지
        Integer chatId,             // 채팅 알림이 아니므로 null
        Integer roomId,             // 채팅 알림이 아니므로 null
        Integer senderId,           // 발신자 ID
        String senderName           // 발신자 이름
    ) {
        if (senderId == null) {
            log.warn("[NotificationService] senderId가 null입니다. 여러명에 알림 중단.");
            return;
        }
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new EntityNotFoundException("알림 발신자 없음: " + senderId));

        if (recipientIds == null) {
            log.warn("[NotificationService] recipientIds 리스트가 null입니다. 여러명에 알림 중단.");
            return;
        }

        for (Integer recipientId : recipientIds) {
            if (recipientId == null) {
                log.warn("[NotificationService] recipientId 중 null 있음. 스킵.");
                continue;
            }
            User receiver = userRepository.findById(recipientId)
                .orElseThrow(() -> new EntityNotFoundException("알림 수신자 없음: " + recipientId));

            Notification notification = Notification.createNotification(
                receiver, type, message, null, null, false, false, false,
                LocalDateTime.now(), null, sender
            );
            log.info("sentAt on save: {}", notification.getNotificationSentAt());
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

            webSocketDeliveryService.sendToUser(recipientId, payload);
        }
    }
}