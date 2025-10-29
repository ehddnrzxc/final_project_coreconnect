package com.goodee.coreconnect.common.notification.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPayload {
	
	private Integer notificationId;
    private Integer recipientId;
    private Integer chatId;
    private Integer roomId;
    private Integer senderId;
    private String senderName;
    private String message;
    private String notificationType;
    private LocalDateTime createdAt;

  
	
	
}
