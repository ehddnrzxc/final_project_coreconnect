package com.goodee.coreconnect.notice.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationAsyncService {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Async   // 비동기 실행 지점
    public void sendNoticeAsync(List<Integer> receiverIds,
                                 NotificationType type,
                                 String message,
                                 Integer senderId,
                                 String senderName,
                                 Integer boardId
    ) {
        // 로그 추가: boardId 전달 확인
        if (boardId != null) {
            log.info("[NotificationAsyncService] sendNoticeAsync 호출: type={}, boardId={}, message={}", type, boardId, message);
        } else {
            log.warn("[NotificationAsyncService] sendNoticeAsync 호출: type={}, boardId=null, message={}", type, message);
        }
        
        // 기존 BoardServiceImpl 안에서 처리하던 로직과 동일하게 실행
        notificationService.sendNotificationToUsers(receiverIds,
                                                    type,
                                                    message,
                                                    null,
                                                    null,
                                                    senderId,
                                                    senderName,
                                                    boardId,
                                                    null);

        // 전송 상태 업데이트
        notificationRepository.findBySenderId(senderId).forEach(n -> n.markSent(java.time.LocalDateTime.now()));
    }
}
