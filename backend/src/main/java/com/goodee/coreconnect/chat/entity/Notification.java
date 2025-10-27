package com.goodee.coreconnect.chat.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notification")
public class Notification {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Integer id;
   
   @Column(name = "notification_read_yn")
   private Boolean notificationReadYn;
   
   @Enumerated(EnumType.STRING)
   @Column(name = "notification_type", nullable = false)
   private NotificationType notificationType;
   
   @Column(name = "notification_read_at")
   private LocalDateTime notificationReadAt;
   
   @Column(name = "notification_sent_at")
   private LocalDateTime notificationSentAt;
   
   @Column(name = "notification_deleted_yn")
   private Boolean notificationDeletedYn;
   
   @Column(name = "notification_sent_yn")
   private Boolean notificationSentYn;
   
   @Column(name = "notification_message")
   private String notificationMessage;
   
   
   // N : 1 관계 (채팅메시지 테이블과 매핑)
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(
         name = "chat_message_id",
         columnDefinition = "INT UNSIGNED"
   ) 
   private Chat chat;
   
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "doc_id")
   private Document document;
   
   // N : 1 관계 (user 테이블과 매핑)
   // 알림 수신자
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "user_id")
   private User user;
   
}
