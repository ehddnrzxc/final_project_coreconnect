package com.goodee.coreconnect.common.notification.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationDTO {
	private Integer id;
    private String message;
    private String notificationType;
    private LocalDateTime sentAt;
}
