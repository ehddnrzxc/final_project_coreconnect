package com.goodee.coreconnect.chat.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;

import jakarta.annotation.Generated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_message_read_status")
public class ChatMessageReadStatus {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	// 읽음 여부
	@Column(name = "chat_message_read_status_read_yn")
	private Boolean readYn = false; // 기본값: 안읽음
	
	// 읽은 시간
	@Column(name = "chat_message_read_status_read_at")
	private LocalDateTime readAt;
	
	// N : 1 (메시지)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chat_message_id")
	private Chat chat;
	
	// N : 1 (사용자)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	private User user;
	
	protected ChatMessageReadStatus() {}
	
	public static ChatMessageReadStatus create(Chat chat, User user) {
		ChatMessageReadStatus status = new ChatMessageReadStatus();
		status.chat = chat;
		status.user = user;
		status.readYn = false;
		status.readAt = null;
		return status;
	}
	
	// 읽음처리
	public void markRead() {
		this.readYn = true;
		this.readAt = LocalDateTime.now();
	}
	
	public Chat getChat() {
        return chat;
    }
    public User getUser() {
        return user;
    }
    public Boolean getReadYn() {
        return readYn;
    }
    public LocalDateTime getReadAt() {
        return readAt;
    }
    public Integer getId() {
        return id;
    }
	
    public boolean isConsistentReadStatus() {
	  return (readAt == null && Boolean.FALSE.equals(readYn)) ||
	         (readAt != null && Boolean.TRUE.equals(readYn));
	}
}
