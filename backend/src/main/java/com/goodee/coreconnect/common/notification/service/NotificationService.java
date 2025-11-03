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
     * */
    public NotificationReadResponseDTO markAsRead(Integer notificationId, String email) {
    	// 알림 조회
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        
        // 읽음 처리
        notification.markRead();
        
        // 상태 저장
        notificationRepository.save(notification);
        return new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
    }

    /**
     * 알림 저장 + 실시간 WebSocket 푸시
     * - 알림 타입에 따라 chatId/roomId 값 필수 여부 체크
     * - 채팅 알림은 별도 ChatWebSocketHandler에서 처리(여기서는 EMAIL, NOTICE, APPROVAL, SCHEDULE만 처리)
     */
    @Transactional
    public void sendNotification(
    		Integer recipientId, // 알림 받을 사용자 
    		NotificationType type,  // 알림 타입 (EMAIL, NOTICE, APPROVAL, SCHEDULE)
    		String message, // 알림 메시지
    		Integer chatId, // 채팅 알림일때만
    		Integer roomId, // 채팅 알림일때만
    		Integer senderId, // 발신자 사용자 ID
    		String senderName // 발신자 이름
    		) {
        // 알림 수신자 조회
        User recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new IllegalArgumentException("알림 수신자 없음: " + recipientId));

        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("알림 발신자 없음: " + senderId));
        }
        
         // --- 여기서 알림 타입별로 chatId/roomId 필수 체크 ---
        // 채팅 알림 타입은 없음. 만약 chatId/roomId가 값이 들어오면 무시하거나 로깅
        if ((type == NotificationType.EMAIL || type == NotificationType.NOTICE || type == NotificationType.APPROVAL || type == NotificationType.SCHEDULE)
            && (chatId != null || roomId != null)) {
            log.warn("[NotificationService] {} 알림에 chatId/roomId가 값으로 들어왔습니다. 무시합니다.", type.name());
            chatId = null;
            roomId = null;
        }
        
        // 알림 엔티티 생성 및 DB 저장 (chat, document 확장 시 추가)
        Notification notification = Notification.createNotification(
                recipient, // 알림 수신자
                type,      // 알림 타입
                message,   // 알림 메시지
                null,      // chat, document 등 필요시 확장
                null,
                false,
                false,
                false,
                LocalDateTime.now(), // 알림 생성 시각
                null,
                sender
        );
        notificationRepository.save(notification); // DB 저장

        // 공통 DTO 생성 (채팅 알림이 아니므로 chatId/roomId는 null)
        NotificationPayload payload = new NotificationPayload();
        payload.setNotificationId(notification.getId());
        payload.setSenderId(notification.getSender() != null ? notification.getSender().getId() : null);
        payload.setSenderName(notification.getSender() != null ? notification.getSender().getName() : "");
        payload.setRecipientId(notification.getUser() != null ? notification.getUser().getId() : null);
        payload.setReceiverName(notification.getUser() != null ? notification.getUser().getName() : "");
        payload.setMessage(notification.getNotificationMessage());
        payload.setNotificationType(type.name());
        payload.setCreatedAt(notification.getNotificationSentAt() != null ? notification.getNotificationSentAt() : LocalDateTime.now());

        // 실시간 WebSocket 푸시
        webSocketDeliveryService.sendToUser(recipientId, payload);

        log.info("[NotificationService] {} 알림 전송 완료: recipientId={}, type={}, message={}", type, recipientId, type, message);
    }

    /**
     * 여러 사용자에게 알림 전송 (공통)
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
    	User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("알림 발신자 없음: " + senderId));

        for (Integer recipientId : recipientIds) {
            User receiver = userRepository.findById(recipientId)
                .orElseThrow(() -> new EntityNotFoundException("알림 수신자 없음: " + recipientId));

            Notification notification = Notification.createNotification(
                receiver,    // 수신자(User)
                type,
                message,
                null,
                null,
                false,
                false,
                false,
                LocalDateTime.now(),
                null,
                sender      // 발신자(User)
            );
         // 로그 찍기
            log.info("sentAt on save: {}", notification.getNotificationSentAt());
            notificationRepository.save(notification);

            NotificationPayload payload = new NotificationPayload();
            payload.setNotificationId(notification.getId());
            payload.setSenderId(sender.getId());
            payload.setSenderName(sender.getName());
            payload.setRecipientId(receiver.getId()); // recipientId로 수정
            payload.setReceiverName(receiver.getName());
            payload.setMessage(message);
            payload.setNotificationType(type.name());
            payload.setCreatedAt(notification.getNotificationSentAt());

            webSocketDeliveryService.sendToUser(recipientId, payload);
        }
    }
}
