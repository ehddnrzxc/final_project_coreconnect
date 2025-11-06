package com.goodee.coreconnect.email.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "email_recipient")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // 기본 생성자 protected
@AllArgsConstructor
@Builder
public class EmailRecipient {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer emailRecipientId;

	private String emailRecipientType; // TO/CC/BCC
	private String emailRecipientAddress; // 외부메일주소
	private Integer userId; // 내부직원 FK(user)
	
	private Boolean emailReadYn = false;
	private LocalDateTime emailReadAt;
	
	
	private Boolean emailIsAlarmSent = false;
	
	@ManyToOne
	@JoinColumn(name = "email_id", referencedColumnName = "emailId")
	private Email email; // 메일 본문
	
	@ManyToOne
	@JoinColumn(name = "email_id2", referencedColumnName = "emailId")
	private Email extendedEmail; // 확장용(참조, 답신)
	
	
	
	
	
}
