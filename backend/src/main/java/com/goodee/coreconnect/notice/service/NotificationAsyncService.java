package com.goodee.coreconnect.notice.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationAsyncService {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Async   // 비동기 실행 지점
    public void sendNoticeAsync(
            List<Integer> receiverIds,
            NotificationType type,
            String message,
            Integer senderId,
            String senderName
    ) {
        // 기존 BoardServiceImpl 안에서 처리하던 로직과 동일하게 실행
        notificationService.sendNotificationToUsers(
                receiverIds,
                type,
                message,
                null,
                null,
                senderId,
                senderName
        );

        // 전송 상태 업데이트
        notificationRepository.findBySenderId(senderId)
                .forEach(n -> n.markSent(java.time.LocalDateTime.now()));
    }
}
