package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.common.entity.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UnreadNotificationSummaryDTO {
	private Integer notificationId; // 최신 알림 ID
    private String message;         // 최신 알림 메시지
    private String senderName;      // 알림 보낸 사람 이름
    @JsonFormat(pattern = "yyyy-MM-dd H HH:mm:ss")
    private LocalDateTime sentAt;   // 최신 알림 발송 시간
    private String notificationType;// 알림 타입
    private int unreadCount;        // 미읽은 알림 개수

    public static UnreadNotificationSummaryDTO from(Notification latest, int unreadCount) {
        if (latest == null) {
            return UnreadNotificationSummaryDTO.builder()
                    .notificationId(null)
                    .message(null)
                    .senderName(null)
                    .sentAt(null)
                    .notificationType(null)
                    .unreadCount(unreadCount)
                    .build();
        }
        return UnreadNotificationSummaryDTO.builder()
                .notificationId(latest.getId())
                .message(latest.getNotificationMessage())
                .senderName(latest.getUser() != null ? latest.getUser().getName() : null)
                .sentAt(latest.getNotificationSentAt())
                .notificationType(latest.getNotificationType() != null ? latest.getNotificationType().name() : null)
                .unreadCount(unreadCount)
                .build();
    }

}
