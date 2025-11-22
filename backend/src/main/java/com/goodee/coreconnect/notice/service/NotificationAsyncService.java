package com.goodee.coreconnect.notice.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationAsyncService {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    // @Async   // 비동기 실행 지점 - NOTICE 저장 문제 해결을 위해 일시적으로 주석 처리 (테스트용)
    // 주의: @Async를 주석 처리하면 동기적으로 실행되어 트랜잭션이 제대로 작동합니다.
    // 문제 해결 후 다시 활성화하세요.
    // @Transactional 제거 - NotificationService에서 TransactionTemplate으로 처리
    public void sendNoticeAsync(List<Integer> receiverIds,
                                 NotificationType type,
                                 String message,
                                 Integer senderId,
                                 String senderName,
                                 Integer boardId
    ) {
        log.info("[NotificationAsyncService] ===== sendNoticeAsync 시작 ===== type={}, boardId={}, message={}, recipientCount={}, senderId={}", 
                type, boardId, message, receiverIds != null ? receiverIds.size() : 0, senderId);
        
        // 트랜잭션 활성 상태 확인
        boolean isTransactionActive = org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive();
        log.info("[NotificationAsyncService] 트랜잭션 활성 상태: {}", isTransactionActive);
        
        // 파라미터 검증
        if (receiverIds == null || receiverIds.isEmpty()) {
            log.warn("[NotificationAsyncService] receiverIds가 null이거나 비어있습니다. 알림 전송 중단.");
            return;
        }
        if (senderId == null) {
            log.warn("[NotificationAsyncService] senderId가 null입니다. 알림 전송 중단.");
            return;
        }
        if (type == null) {
            log.warn("[NotificationAsyncService] type이 null입니다. 알림 전송 중단.");
            return;
        }
        
        log.info("[NotificationAsyncService] 파라미터 검증 완료: receiverIds.size()={}, senderId={}, type={}, boardId={}", 
                receiverIds.size(), senderId, type, boardId);
        
        try {
            // NotificationService.sendNotificationToUsers는 TransactionTemplate으로 명시적 트랜잭션 관리
            log.info("[NotificationAsyncService] ===== NotificationService.sendNotificationToUsers 호출 시작 ===== type={}, recipientCount={}, senderId={}, boardId={}", 
                    type, receiverIds.size(), senderId, boardId);
            
            notificationService.sendNotificationToUsers(receiverIds,
                                                        type,
                                                        message,
                                                        null,
                                                        null,
                                                        senderId,
                                                        senderName,
                                                        boardId,
                                                        null);
            
            log.info("[NotificationAsyncService] ===== NotificationService.sendNotificationToUsers 호출 완료 ===== type={}, recipientCount={}", 
                    type, receiverIds.size());
            
            log.info("[NotificationAsyncService] ===== 알림 전송 완료 ===== recipientCount={}, type={}", 
                    receiverIds.size(), type);
        } catch (Exception e) {
            log.error("[NotificationAsyncService] ===== 알림 전송 실패 ===== type={}, message={}, recipientCount={}, senderId={}, 예외: {}", 
                    type, message, receiverIds != null ? receiverIds.size() : 0, senderId, e.getMessage(), e);
            e.printStackTrace(); // 스택 트레이스 출력
            // 예외를 다시 던져서 호출자에게 알림
            throw new RuntimeException("알림 전송 실패: " + e.getMessage(), e);
        }
    }
}
