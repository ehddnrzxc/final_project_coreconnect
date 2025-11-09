package com.goodee.coreconnect.email.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Cascade;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "email")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // 기본 생성자 protected
@AllArgsConstructor
@Builder
public class Email {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer emailId;
	
	@Column(nullable = false, length = 20)
	private String emailTitle;
	
	@Column(nullable = false, columnDefinition = "TEXT")
	private String emailContent;
	
	private Boolean emailDeleteYn = false; // 삭제여부 (휴지통 분리)
	private Boolean emailSaveStatusYn = false; // 임시저장
	private Boolean favoriteStatus = false; // 중요표시
	
	private String emailType;
	
	@Column(name = "sender_email", nullable = false, length = 100)
	private String senderEmail;
	
	@Enumerated(EnumType.STRING)
	private EmailStatusEnum emailStatus; // SENT/BOUNCE/FAILED/DELETED (enum)
	
	@Column(length = 255)
	private String emailBounceReason; // 반송 사유
	
	@Column(nullable = false)
	private Integer senderId; // 발신자
	
	private LocalDateTime emailSentTime;
	private LocalDateTime emailDeletedTime;
	private LocalDateTime emailReadAt;
	
	private String emailFolder; // INBOX, SENT, TRASH
	
	// 답신
	private String replyToEmailId;
	private Integer emailId2; // 확장 FK 필드
	
	// 연관관계
	@OneToMany(mappedBy = "email", cascade = CascadeType.ALL)
	@JsonManagedReference
	private List<EmailRecipient> recipients;
	
	@OneToMany(mappedBy = "email", cascade = CascadeType.ALL)
	private List<EmailFile> files;
	
	
	
	
	
	
	
}
