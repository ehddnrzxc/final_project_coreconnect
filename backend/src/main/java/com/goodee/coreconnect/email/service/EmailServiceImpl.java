package com.goodee.coreconnect.email.service;

import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
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
	public EmailResponseDTO getEmailDetail(Integer emailId, String viewerEmail) {
	    // 1. 이메일 엔티티 조회
	    com.goodee.coreconnect.email.entity.Email email = emailRepository.findById(emailId)
	            .orElseThrow(() -> new IllegalArgumentException("메일이 존재하지 않습니다." + emailId));
	    // 전체 수신자 목록
	    List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(email);

	    // --- 읽음 처리 [빌더 패턴]
	    Optional<EmailRecipient> myRecipientOpt = recipients.stream()
	        .filter(r -> viewerEmail.equals(r.getEmailRecipientAddress()))
	        .findFirst();
	    if (myRecipientOpt.isPresent() && Boolean.FALSE.equals(myRecipientOpt.get().getEmailReadYn())) {
	        EmailRecipient old = myRecipientOpt.get();
	        EmailRecipient updated = EmailRecipient.builder()
	            .emailRecipientId(old.getEmailRecipientId())
	            .emailRecipientType(old.getEmailRecipientType())
	            .emailRecipientAddress(old.getEmailRecipientAddress())
	            .userId(old.getUserId())
	            .emailReadYn(true)
	            .emailReadAt(LocalDateTime.now())
	            .emailIsAlarmSent(old.getEmailIsAlarmSent())
	            .email(old.getEmail())
	            .extendedEmail(old.getExtendedEmail())
	            .build();
	        emailRecipientRepository.save(updated);
	    }

	    // 2. 관련 수신자, 첨부파일 조회 (엔티티 직접 분리)
	    List<EmailRecipient> toRecipients = recipients.stream()
	        .filter(r -> "TO".equalsIgnoreCase(r.getEmailRecipientType()))
	        .collect(Collectors.toList());
	    List<EmailRecipient> ccRecipients = recipients.stream()
	        .filter(r -> "CC".equalsIgnoreCase(r.getEmailRecipientType()))
	        .collect(Collectors.toList());
	    List<EmailRecipient> bccRecipients = recipients.stream()
	        .filter(r -> "BCC".equalsIgnoreCase(r.getEmailRecipientType()))
	        .filter(r -> r.getEmailRecipientAddress().equals(viewerEmail)) // 본인만!
	        .collect(Collectors.toList());

	    // 이메일 주소 리스트(구형 프론트 병행 호환)
	    List<String> toAddresses = toRecipients.stream()
	        .map(EmailRecipient::getEmailRecipientAddress)
	        .collect(Collectors.toList());
	    List<String> ccAddresses = ccRecipients.stream()
	        .map(EmailRecipient::getEmailRecipientAddress)
	        .collect(Collectors.toList());
	    List<String> bccAddresses = bccRecipients.stream()
	        .map(EmailRecipient::getEmailRecipientAddress)
	        .collect(Collectors.toList());

	    // 첨부파일 조회
	    List<EmailFile> files = emailFileRepository.findByEmail(email);
	    List<Integer> fileIds = files.stream()
	            .map(EmailFile::getEmailFileId)
	            .collect(Collectors.toList());

	    // 3. 엔티티를 DTO로 변환 후 반환
	    EmailResponseDTO response = new EmailResponseDTO();
	    response.setEmailId(email.getEmailId());
	    response.setEmailTitle(email.getEmailTitle());
	    response.setEmailContent(email.getEmailContent());
	    response.setSenderId(email.getSenderId());
	    response.setSenderEmail(email.getSenderEmail()); // [이 부분이 빠져 있었음! 꼭 추가]
	    response.setSentTime(email.getEmailSentTime());
	    response.setEmailStatus(email.getEmailStatus().name());
	    response.setSenderName(""); // 필요에 따라 UserRepository로 이름 조회
	    response.setSenderDept(""); // 필요에 따라 UserRepository로 부서명 조회
	    response.setRecipientAddresses(toAddresses);
	    response.setCcAddresses(ccAddresses);
	    response.setBccAddresses(bccAddresses);
	    response.setFileIds(fileIds);
	    response.setReplyToEmailId(email.getReplyToEmailId());
	    // [신규] 엔티티도 세팅
	    response.setToRecipients(toRecipients);
	    response.setCcRecipients(ccRecipients);
	    response.setBccRecipients(bccRecipients);

	    return response;
	}

	/**
	 * [받은 메일함 조회] 
	 * - 사용자가 TO 또는 CC로 수신한 메일 목록을 페이징해서 반환합니다.
	 * - filter 옵션으로 '전체', '오늘', '안읽은' 메일만 반환 가능
	 *   filter: null/기타 → 전체
	 *   filter: "today"   → 오늘 온 메일만
	 *   filter: "unread"  → 읽지 않은 메일만
	 *
	 * @param userEmail 조회(로그인)자 이메일 주소
	 * @param page      페이징 번호 (0부터 시작)
	 * @param size      한 페이지에 표시할 메일 개수
	 * @param filter    today/unread/전체(null) 등 조회 옵션
	 * @return Page<EmailResponseDTO>
	 */
	@Override
	public Page<EmailResponseDTO> getInbox(String userEmail, int page, int size, String filter) {
		Pageable pageable = PageRequest.of(page, size);
		
		 // 기본적으로 TO/CC로 받은 메일만 조회할 수 있게 recipientType 조건을 만듭니다
		// [수정] TO/CC/BCC를 모두 포함
	    List<String> types = List.of("TO", "CC", "BCC");
	    Page<EmailRecipient> recipientPage; // 쿼리 결과 페이징 데이터

	    // filter 파라미터(메소드 인자)로 뷰에서 '오늘', '안읽음', '전체' 등 분기 처리
	    if ("unread".equalsIgnoreCase(filter)) {
	        // 안읽은 메일만 조회
	    	 // [상세] '안읽은 메일'만 조회: 읽음여부(emailReadYn)가 false인 이메일만 select
	        // (JPA 쿼리 메소드: findByEmailRecipientAddressAndEmailRecipientTypeInAndEmailReadYn)
	    	// 안읽은 메일만 (TO/CC/BCC)
	    	recipientPage = emailRecipientRepository.findByEmailRecipientAddressAndEmailRecipientTypeInAndEmailReadYn(
	                userEmail, types, false, pageable
	            );
	    } else if ("today".equalsIgnoreCase(filter)) {
	        // 오늘 온 메일만 조회 (수신일 기준)
	        // 오늘 날짜 계산
	    	 // 오늘 온 (TO/CC/BCC)
	        LocalDate today = LocalDate.now();
	        LocalDateTime startOfDay = today.atStartOfDay();
	        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);

	        log.debug("[INBOX] '오늘온 메일' 조회 - userEmail={}, 날짜범위:{} ~ {}, page={}, size={}", userEmail, startOfDay, endOfDay, page, size);
	        recipientPage = emailRecipientRepository.findByEmailRecipientAddressAndEmailRecipientTypeInAndEmail_EmailSentTimeBetween(
	            userEmail, types, startOfDay, endOfDay, pageable
	        );
	        
	    } else {
	        // 전체 조회
	    	// [전체 메일] (조건 없이 받은 전체 - TO/CC)
	        log.debug("[INBOX] 전체 메일 조회 - userEmail={}, page={}, size={}", userEmail, page, size);
	        // 전체 (TO/CC/BCC)
	        recipientPage = emailRecipientRepository.findByEmailRecipientAddressAndEmailRecipientTypeIn(
	            userEmail, types, pageable
	        );
	    }
		
		// 수신함 결과에서 메일 엔티티만 추출해서 중복 없이 리스트화
		List<com.goodee.coreconnect.email.entity.Email> emailList = recipientPage.stream()
				.map(EmailRecipient::getEmail)
				.distinct()
				.collect(Collectors.toList());
		
		// 각 메일 엔티티를 EmailResponseDTO로 변환 (기본정보만)
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
		
		// [5] PageImpl로 반환 (총개수: recipient 기준)
		log.debug("[INBOX] 반환 결과 dto count={}, totalElements={}", dtoList.size(), recipientPage.getTotalElements());
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
		 log.info("[DEBUG] sendEmail: senderId={}, senderAddress={}",
	             requestDTO.getSenderId(), requestDTO.getSenderAddress());

		
		
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
