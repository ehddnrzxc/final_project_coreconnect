package com.goodee.coreconnect.email.service;

import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.email.dto.request.EmailAttachmentRequestDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTo;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;
import com.goodee.coreconnect.email.entity.EmailFile;
import com.goodee.coreconnect.email.entity.EmailRecipient;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;
import com.goodee.coreconnect.email.repository.EmailFileRepository;
import com.goodee.coreconnect.email.repository.EmailRecipientRepository;
import com.goodee.coreconnect.email.repository.EmailRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

	private final EmailRepository emailRepository;
	private final EmailFileRepository emailFileRepository;
	private final EmailRecipientRepository emailRecipientRepository;
	private final UserRepository userRepository;
	private final S3Service s3Service;
	
	@Value("${sendgrid.api.key}")
	private String senGridApiKey; 

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
	            // ★ senderId -> senderName 조회
	            Integer senderId = email.getSenderId();
	            String senderName = userRepository.findById(senderId)
	                .map(User::getName) // User 엔티티의 getUserName 메서드 참고
	                .orElse(""); // 없으면 빈 문자열 등
	            dto.setSenderName(senderName);
	            return dto;
	        }).collect(Collectors.toList());
		
		// Page 반환
	    return new PageImpl<>(dtoList, pageable, recipientPage.getTotalElements());
	}

	@Override
	public Page<EmailResponseDTO> getSentbox(String userEmail, int page, int size) {
		Pageable pageable = PageRequest.of(page, size);
		
		// 내가 발신자(sender)로 보낸 이메일만
		Page<com.goodee.coreconnect.email.entity.Email> emailPage = 
				emailRepository.findBySenderEmail(userEmail, pageable);
		
		List<EmailResponseDTO> dtoList = emailPage.stream().map(email -> {
		    EmailResponseDTO dto = new EmailResponseDTO();

		    // email 엔티티의 기본 필드 세팅
		    dto.setEmailId(email.getEmailId());
		    dto.setEmailTitle(email.getEmailTitle());
		    dto.setEmailContent(email.getEmailContent());
		    dto.setSenderId(email.getSenderId());
		    dto.setSentTime(email.getEmailSentTime());
		    dto.setEmailStatus(email.getEmailStatus() != null ? email.getEmailStatus().name() : null);
		    dto.setReplyToEmailId(email.getReplyToEmailId());

		    // 수신자 정보
		    List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(email);

		    // 수신자 정보 추가
		    List<String> toAddresses = recipients.stream()
		        .filter(r -> "TO".equalsIgnoreCase(r.getEmailRecipientType()))
		        .map(EmailRecipient::getEmailRecipientAddress)
		        .collect(Collectors.toList());
		    dto.setRecipientAddresses(toAddresses);

		    // 참조 정보 추가
		    List<String> ccAddresses = recipients.stream()
		        .filter(r -> "CC".equalsIgnoreCase(r.getEmailRecipientType()))
		        .map(EmailRecipient::getEmailRecipientAddress)
		        .collect(Collectors.toList());
		    dto.setCcAddresses(ccAddresses);

		    // 숨은 참조 정보 추가
		    List<String> bccAddresses = recipients.stream()
		        .filter(r -> "BCC".equalsIgnoreCase(r.getEmailRecipientType()))
		        .map(EmailRecipient::getEmailRecipientAddress)
		        .collect(Collectors.toList());
		    dto.setBccAddresses(bccAddresses);

		    // 첨부파일 정보 (예시)
		    // List<EmailFile> files = emailFileRepository.findByEmail(email);
		    // List<Integer> fileIds = files.stream()
		    //     .map(EmailFile::getEmailFileId)
		    //     .collect(Collectors.toList());
		    // dto.setFileIds(fileIds);

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

	/**
     * 이메일을 SendGrid로 발송하고 DB에 저장합니다.
	 * @throws IOException 
     */
	@Override
	public EmailResponseDTO sendEmail(EmailSendRequestDTo requestDTO, List<MultipartFile> attachments) throws IOException {
		// 1. SendGrid 메일 정보 준비
	    Email from = new Email(requestDTO.getSenderAddress());
	    String subject = requestDTO.getEmailTitle();

	    List<Personalization> personalizations = new ArrayList<>();
	    Personalization personalization = new Personalization();
	    for (String to : requestDTO.getRecipientAddress()) {
	        personalization.addTo(new Email(to));
	    }
	    if (requestDTO.getCcAddresses() != null) {
	        for (String cc : requestDTO.getCcAddresses()) {
	            personalization.addCc(new Email(cc));
	        }
	    }
	    if (requestDTO.getBccAddresses() != null) {
	        for (String bcc : requestDTO.getBccAddresses()) {
	            personalization.addBcc(new Email(bcc));
	        }
	    }
	    personalizations.add(personalization);

	    Content content = new Content("text/plain", requestDTO.getEmailContent());
	    Mail mail = new Mail();
	    mail.setFrom(from);
	    mail.setSubject(subject);
	    mail.addContent(content);
	    for (Personalization p : personalizations) {
	        mail.addPersonalization(p);
	    }

	    // 첨부파일 처리 & 저장
//	    if (requestDTO.getAttachments() != null) {
//	        for (EmailAttachmentRequestDTO attachDTO : requestDTO.getAttachments()) {
//	            Attachments attachments2 = new Attachments();
//	            String base64Content = attachDTO.getBaSE64cONTENT();
//	            if (base64Content == null || base64Content.isEmpty()) {
//	                throw new RuntimeException("첨부파일의 Base64 Content가 비어있습니다. API 호출 전에 인코딩해주세요.");
//	            }
//	            attachments2.setContent(base64Content);
//	            attachments2.setType(attachDTO.getMimeType());
//	            attachments2.setFilename(attachDTO.getFileName());
//	            mail.addAttachments(attachments2);
//
//	            EmailFile emailFile = EmailFile.builder()
//	                .emailFileName(attachDTO.getFileName())
//	                .emailFileSize(attachDTO.getFileSize())
//	                .emailFileS3ObjectKey("s3_object_key")
//	                .emailFielDeletedYn(false)
//	                .build();
//	            emailFileRepository.save(emailFile);
//	        }
//	    }

	    // 2. DB에 저장할 Email 엔티티 생성 및 저장
	    com.goodee.coreconnect.email.entity.Email entity = com.goodee.coreconnect.email.entity.Email.builder()
	        .emailTitle(requestDTO.getEmailTitle())
	        .emailContent(requestDTO.getEmailContent())
	        .emailStatus(EmailStatusEnum.SENT)
	        .emailSentTime(LocalDateTime.now())
	        .senderId(requestDTO.getSenderId())                         // 발신자 id
	        .senderEmail(requestDTO.getSenderAddress())                 // 발신자 이메일(★중요) 
	        .favoriteStatus(false)
	        .emailDeleteYn(false)
	        .emailSaveStatusYn(false)
	        .emailType(requestDTO.getEmailType())
	        .emailFolder("SENT")
	        .replyToEmailId(requestDTO.getReplyToEmailId())
	        .build();

	    com.goodee.coreconnect.email.entity.Email savedEmail = emailRepository.save(entity);

	    // 3. 수신자 정보 DB 저장 (user_id 채움)
	    // TO
	    
	    for (String to : requestDTO.getRecipientAddress()) {
	        Optional<User> userOptional = userRepository.findByEmail(to); // 반환타입 직접 명시
	        Integer userId = userOptional.isPresent() ? userOptional.get().getId() : null;
	        EmailRecipient recipient = EmailRecipient.builder()
	            .emailRecipientType("TO")
	            .emailRecipientAddress(to)
	            .userId(userId)
	            .emailReadYn(false)
	            .emailIsAlarmSent(false)
	            .email(savedEmail)
	            .build();
	        emailRecipientRepository.save(recipient);
	    }

	    if (requestDTO.getCcAddresses() != null) {
	        for (String cc : requestDTO.getCcAddresses()) {
	            Optional<User> userOptional = userRepository.findByEmail(cc);
	            Integer userId = userOptional.isPresent() ? userOptional.get().getId() : null;
	            EmailRecipient ccRecipient = EmailRecipient.builder()
	                .emailRecipientType("CC")
	                .emailRecipientAddress(cc)
	                .userId(userId)
	                .emailReadYn(false)
	                .emailIsAlarmSent(false)
	                .email(savedEmail)
	                .build();
	            emailRecipientRepository.save(ccRecipient);
	        }
	    }

	    if (requestDTO.getBccAddresses() != null) {
	        for (String bcc : requestDTO.getBccAddresses()) {
	            Optional<User> userOptional = userRepository.findByEmail(bcc);
	            Integer userId = userOptional.isPresent() ? userOptional.get().getId() : null;
	            EmailRecipient bccRecipient = EmailRecipient.builder()
	                .emailRecipientType("BCC")
	                .emailRecipientAddress(bcc)
	                .userId(userId)
	                .emailReadYn(false)
	                .emailIsAlarmSent(false)
	                .email(savedEmail)
	                .build();
	            emailRecipientRepository.save(bccRecipient);
	        }
	    }

	    // 결과 DTO
	    EmailResponseDTO resultDTO = new EmailResponseDTO();
	    resultDTO.setEmailId(savedEmail.getEmailId());
	    resultDTO.setEmailStatus("SENT");
	    resultDTO.setEmailTitle(savedEmail.getEmailTitle());
	    resultDTO.setEmailContent(savedEmail.getEmailContent());
	    
	    log.info("여기찍힘");
	    if (attachments != null && !attachments.isEmpty()) {
	    	 log.info("여기찍힘2");
	    	for (MultipartFile file : attachments) {
	    		log.info("여기찍힘3");
	    		// 1. 파일 정보 추출
	    		String fileName = file.getOriginalFilename();
	    		long fileSize = file.getSize();
	    		String mimeType = file.getContentType();
	    		
	    		// s3 파일 업로드
	    		String s3key = s3Service.uploadApprovalFile(file);
	    		log.info("s3Key: {}", s3key);
	    		
	    		// 2. 파일을 바로 저장하거나 Bas364 인코딩 등 필요에 따라 처리
	    		byte[] fileBytes = file.getBytes();
	    		String base64Content = Base64.getEncoder().encodeToString(fileBytes);
	    		
	    		// 3. SendGrid 첨부 생성
	    		Attachments sendGridAttacment = new Attachments();
	    		sendGridAttacment.setFilename(fileName);
	    		sendGridAttacment.setType(mimeType);
	    		sendGridAttacment.setContent(base64Content);
	    		

	            mail.addAttachments(sendGridAttacment);
	            
	            // 4. DB 등에 저장할 파일정보 객체 예시
	            EmailFile emailFile = EmailFile.builder()
	                    .emailFileName(fileName)
	                    .emailFileSize(fileSize)
	                    .emailFileS3ObjectKey(s3key)
	                    .emailFielDeletedYn(false)
	                    .email(savedEmail) 
	                    .build();
	            emailFileRepository.save(emailFile);
	    	}
	    }

	    return resultDTO;
	}

}
