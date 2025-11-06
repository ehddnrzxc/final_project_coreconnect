package com.goodee.coreconnect.email.service;

import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

	/**이메일 상세조회*/
	@Override
	public EmailResponseDTO getEmailDetail(Integer emailId) {
		// 1. 이메일 엔티티 조회
		com.goodee.coreconnect.email.entity.Email email  = emailRepository.findById(emailId)
				.orElseThrow(() -> new IllegalArgumentException("메일이 존재하지 않습니다." + emailId));
		
		// 2. 관련 수신자, 첨부파일 조회
		List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(email);
		List<String> toAddresses = recipients.stream()
		            .filter(r -> "TO".equalsIgnoreCase(r.getEmailRecipientType()))
		            .map(EmailRecipient::getEmailRecipientAddress)
		            .collect(Collectors.toList());
				
		List<String> ccAddresses = recipients.stream()
				.filter(r -> "CC".equalsIgnoreCase(r.getEmailRecipientType()))
				.map(EmailRecipient::getEmailRecipientAddress)
				.collect(Collectors.toList());
		
		 List<String> bccAddresses = recipients.stream()
		            .filter(r -> "BCC".equalsIgnoreCase(r.getEmailRecipientType()))
		            .map(EmailRecipient::getEmailRecipientAddress)
		            .collect(Collectors.toList());
		 List<EmailFile> files = emailFileRepository.findByEmail(email);
		 // 파일 ID 목록 반환
		 List<Integer> fileIds = files.stream()
		            .map(EmailFile::getEmailFileId)
		            .collect(Collectors.toList());
		 
		// 3. 엔티티를 DTO로 변환 후 반환
        EmailResponseDTO response = new EmailResponseDTO();
        response.setEmailId(email.getEmailId());
        response.setEmailTitle(email.getEmailTitle());
        response.setEmailContent(email.getEmailContent());
        response.setSenderId(email.getSenderId());
        response.setSentTime(email.getEmailSentTime());
        response.setEmailStatus(email.getEmailStatus().name());
        response.setRecipientAddresses(toAddresses);
        response.setCcAddresses(ccAddresses);
        response.setBccAddresses(bccAddresses);
        response.setFileIds(fileIds);
        response.setReplyToEmailId(email.getReplyToEmailId());
        return response;
	}

	@Override
	public Page<EmailResponseDTO> getInbox(Integer userId, int page, int size) {
		Pageable pageable = PageRequest.of(page, size);
		
		// 내가 TO 또는 CC로 수신한 메일 (EmailRecipient에서 userId기준 TO/CC)
		Page<EmailRecipient> recipientPage = emailRecipientRepository.findByUserIdAndEmailRecipientTypeIn(
		    userId,
		    List.of("TO", "CC"),
		    pageable
		);
		
		// Email 엔티티 모음
		List<com.goodee.coreconnect.email.entity.Email> emailList = recipientPage.stream()
				.map(EmailRecipient::getEmail)
				.distinct()
				.collect(Collectors.toList());
		
		// DTO로 변환
		 List<EmailResponseDTO> dtoList = emailList.stream().map(email -> {
	            EmailResponseDTO dto = new EmailResponseDTO();
	            dto.setEmailId(email.getEmailId());
	            dto.setEmailTitle(email.getEmailTitle());
	            dto.setEmailContent(email.getEmailContent());
	            dto.setSenderId(email.getSenderId());
	            dto.setSentTime(email.getEmailSentTime());
	            dto.setEmailStatus(email.getEmailStatus().name());
	            dto.setReplyToEmailId(email.getReplyToEmailId());
	            // 수신/참조/숨은참조 및 파일정보까지 상세조회 필요하면 추가적으로 Repository 사용!
	            return dto;
	        }).collect(Collectors.toList());
		
		// Page 반환
	    return new PageImpl<>(dtoList, pageable, recipientPage.getTotalElements());
	}

	@Override
	public Page<EmailResponseDTO> getSentbox(Integer userId, int page, int size) {
		Pageable pageable = PageRequest.of(page, size);
		
		// 내가 발신자(sender)로 보낸 이메일만
		Page<com.goodee.coreconnect.email.entity.Email> emailPage = 
				emailRepository.findBySenderId(userId, pageable);
		
		 List<EmailResponseDTO> dtoList = emailPage.stream().map(email -> {
	            EmailResponseDTO dto = new EmailResponseDTO();
	            dto.setEmailId(email.getEmailId());
	            dto.setEmailTitle(email.getEmailTitle());
	            dto.setEmailContent(email.getEmailContent());
	            dto.setSenderId(email.getSenderId());
	            dto.setSentTime(email.getEmailSentTime());
	            dto.setEmailStatus(email.getEmailStatus().name());
	            dto.setReplyToEmailId(email.getReplyToEmailId());
	            return dto;
	        }).collect(Collectors.toList());
		
		 return new PageImpl<>(dtoList, pageable, emailPage.getTotalElements());
	}

	
	/**
	 * 반송함(BounceBox): 내가 보낸 메일 중 반송(Bounce) 처리된 메일만 페이징 조회 반환
	 * 
	 * */
	@Override
	public Page<EmailResponseDTO> getBounceBox(Integer userId, int page, int size) {
		Pageable pageable = PageRequest.of(page, size);

        // 발신자(userId)이고 상태가 BOUNCE인 메일 페이징 조회
        Page<com.goodee.coreconnect.email.entity.Email> emailPage =
                emailRepository.findBySenderIdAndEmailStatus(userId, EmailStatusEnum.BOUNCE, pageable);

        List<EmailResponseDTO> dtoList = emailPage.stream().map(email -> {
            EmailResponseDTO dto = new EmailResponseDTO();
            dto.setEmailId(email.getEmailId());
            dto.setEmailTitle(email.getEmailTitle());
            dto.setEmailContent(email.getEmailContent());
            dto.setSenderId(email.getSenderId());
            dto.setSentTime(email.getEmailSentTime());
            dto.setEmailStatus(email.getEmailStatus().name());
            dto.setReplyToEmailId(email.getReplyToEmailId());
            return dto;
        }).collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, emailPage.getTotalElements());
	}

}
