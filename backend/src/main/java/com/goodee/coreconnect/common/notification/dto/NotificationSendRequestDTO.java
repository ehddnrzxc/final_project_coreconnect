package com.goodee.coreconnect.common.notification.dto;

import com.goodee.coreconnect.common.notification.enums.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSendRequestDTO {
	private Integer recipientId;
    private NotificationType type;
    private String message;
    private Integer chatId;
    private Integer roomId;
}
