package com.goodee.coreconnect.chat.event;

import java.util.List;

import org.springframework.context.ApplicationEvent;

import com.goodee.coreconnect.common.notification.dto.NotificationPayload;

public class NotificationCreatedEvent extends ApplicationEvent {
	private static final long serialVersionUID = 1L;

    private final List<NotificationPayload> payloads;

    public NotificationCreatedEvent(Object source, List<NotificationPayload> payloads) {
        super(source);
        this.payloads = payloads;
    }

    public List<NotificationPayload> getPayloads() {
        return payloads;
    }
}
