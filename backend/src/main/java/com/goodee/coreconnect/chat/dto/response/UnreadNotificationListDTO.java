package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.common.entity.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnreadNotificationListDTO {
	private Integer notificationId;
    private String message;
    private String senderName;
    private String receiverName;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;
    private String notificationType;

    // 엔티티 → DTO 변환
    public static UnreadNotificationListDTO from(Notification n) {
        return UnreadNotificationListDTO.builder()
            .notificationId(n.getId())
            .message(n.getNotificationMessage())
            .senderName(n.getSender() != null ? n.getSender().getName() : null)
            .receiverName(n.getUser() != null ? n.getUser().getName() : null)
            .sentAt(n.getNotificationSentAt())
            .notificationType(n.getNotificationType() != null ? n.getNotificationType().name() : null)
            .build();
    
	}
}
