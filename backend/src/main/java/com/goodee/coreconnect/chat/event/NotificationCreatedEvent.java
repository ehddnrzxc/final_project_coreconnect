package com.goodee.coreconnect.chat.event;

import java.util.List;

import org.springframework.context.ApplicationEvent;

import com.goodee.coreconnect.chat.entity.Notification;

public class NotificationCreatedEvent extends ApplicationEvent {
	private static final long serialVersionUID = 1L;

    private final List<Notification> notifications;

    public NotificationCreatedEvent(Object source, List<Notification> notifications) {
        super(source);
        this.notifications = notifications;
    }

    public List<Notification> getNotifications() {
        return notifications;
    }
}
