package com.goodee.coreconnect.email.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.goodee.coreconnect.email.dto.request.EmailAttachmentRequestDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTo;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;
import com.goodee.coreconnect.email.entity.EmailFile;
import com.goodee.coreconnect.email.entity.EmailRecipient;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;
import com.goodee.coreconnect.email.repository.EmailFileRepository;
import com.goodee.coreconnect.email.repository.EmailRecipientRepository;
import com.goodee.coreconnect.email.repository.EmailRepository;

import lombok.RequiredArgsConstructor;

// SendGrid 관련 import (중복/불필요한 alias 제거)
import com.sendgrid.*;
import com.sendgrid.helpers.mail.objects.Email; // SendGrid용 Email 클래스!
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Personalization;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Attachments;

/**
 * 이메일 발송, 답신, 수신 등 SendGrid 연동 서비스 
 * */
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

	private final EmailRepository emailRepository;
	private final EmailFileRepository emailFileRepository;
	private final EmailRecipientRepository emailRecipientRepository;
	
	@Value("${sendgrid.api.key}")
	private String senGridApiKey; 

    /**
     * 이메일을 SendGrid로 발송하고 DB에 저장합니다.
     */
	@Override
	public EmailResponseDTO sendEmail(EmailSendRequestDTo requestDTO) {
		// 1.from, subject 등 SendGrid 객체 생성
		// 발신자 정보 생성
		Email from = new Email(requestDTO.getSenderAddress());
		// 메일 제목 추출
		String subject = requestDTO.getEmailTitle();
		
		// 2. Personoalization(개인용) 수신/참조/숨은참조 설정 및 EmailRecipient 엔티티 생성
		List<Personalization> personalizations = new ArrayList<>();
		// 수신지 그룹 생성
		Personalization personalization = new Personalization();
		
		// DB 저장용 수신자 엔티티 리스트
		List<EmailRecipient> recipientEntities = new ArrayList<>();
		
		// TO 수신자 처리
		for (String to : requestDTO.getRecipientAddress()) {
			// sendGrid에 to 등록
			personalization.addTo(new Email(to));
			
			recipientEntities.add(EmailRecipient.builder()
					.emailRecipientType("TO")
					.emailRecipientAddress(to)
					.emailReadYn(false)
					.emailIsAlarmSent(false)
					.build()					
					);
		}
		
		// cc (참조) 처리
		if (requestDTO.getCcAddresses() != null) {
			for (String cc : requestDTO.getCcAddresses()) {
				personalization.addCc(new com.sendgrid.helpers.mail.objects.Email(cc));
				recipientEntities.add(
					EmailRecipient.builder()
						.emailRecipientType("cc")
						.emailRecipientAddress(cc)
                        .emailReadYn(false)
                        .emailIsAlarmSent(false)
                        .build()
					);
			}
		}
		
		// BCC (숨은참조) 처리
		if (requestDTO.getBccAddresses() != null) {
			for (String bcc : requestDTO.getBccAddresses()) {
				personalization.addBcc(new Email(bcc));
				recipientEntities.add(
				EmailRecipient.builder()
				.emailRecipientType("BCC")
				.emailRecipientAddress(bcc)
				.emailReadYn(false)
				.emailIsAlarmSent(false)
				.build()
				);
			}
		}
		
		// sendGrid personalization에 그룹 추가
		personalizations.add(personalization);
		
		// 3. 본문/제목/수신그룹을 SendGrid용 매일 객체에 등록
		Content content = new Content("text/plain", requestDTO.getEmailContent()); // 매일 내용 준비
		// SendGrid용 매일 객체
		Mail mail = new Mail();
		mail.setFrom(from); // 발신자 정보 세팅
		mail.setSubject(subject); // 제목 세팅
		mail.addContent(content); // 본문 세팅
		for (Personalization p : personalizations) { // 수신자 그룹 모두 추가
			mail.addPersonalization(p);
		}
		
		
		// 4. 첨부파일 처리 (SendGrid API + DB 저장)
		if (requestDTO.getAttachments() != null) {
			for (EmailAttachmentRequestDTO attachDTO : requestDTO.getAttachments()) {
				Attachments attachments = new Attachments(); // sendgrid 첨부파일 객체
				attachments.setContent(attachDTO.getBaSE64cONTENT());
				attachments.setType(attachDTO.getMimeType());
				attachments.setFilename(attachDTO.getFileName());
				mail.addAttachments(attachments);
				
				// EmailFile 엔티티로 라이브럴리 파일 저장시 builder 사용 권장
			    EmailFile emailFile = EmailFile.builder()
			        .emailFileName(attachDTO.getFileName())
			        .emailFileSize(attachDTO.getFileSize())
			        .emailFileS3ObjectKey("s3_object_key") // 실제 S3키/경로 필요시 별도 입력
			        .emailFielDeletedYn(false)
			        // .email(savedEmail) // savedEmail은 이메일 저장 후 set해줌
			        .build();
			    emailFileRepository.save(emailFile);
			}
		}
		
		// 5. DB에 저장할 Email 엔티티 준비 
		com.goodee.coreconnect.email.entity.Email entity = com.goodee.coreconnect.email.entity.Email.builder()
			    .emailTitle(requestDTO.getEmailTitle())
			    .emailContent(requestDTO.getEmailContent())
			    .senderId(requestDTO.getSenderid())
			    .emailStatus(EmailStatusEnum.SENT) // 초기상태: 발송 성공
	            .emailSentTime(LocalDateTime.now())
	            .favoriteStatus(false)
	            .emailDeleteYn(false)
	            .emailSaveStatusYn(false)
	            .emailType(requestDTO.getEmailType())
	            .emailFolder("SENT")
	            .replyToEmailId(requestDTO.getReplyToEmailId())
			    .build();
				
				
		
		
		
		
		
		
		
		
		
		
		return null;
	}

	@Override
	public EmailResponseDTO getEmailDetail(Integer emailId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Page<EmailResponseDTO> getInbox(Integer userId, int page, int size) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Page<EmailResponseDTO> getSentbox(Integer userId, int page, int size) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Page<EmailResponseDTO> getBounceBox(Integer userId, int page, int size) {
		// TODO Auto-generated method stub
		return null;
	}

}
