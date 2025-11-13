package com.goodee.coreconnect.email.service;

import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.email.dto.request.EmailAttachmentRequestDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTO;
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
	
	 @Autowired(required = false)
	 private RedisTemplate<String, Object> redisTemplate; // 레디스 빈 주입, 구성 필요
	
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

	    // 첨부파일 조회 및 세팅
	    files = emailFileRepository.findByEmail(email);
	    List<EmailResponseDTO.AttachmentDTO> attachments = files.stream()
	        .map(f -> new EmailResponseDTO.AttachmentDTO(
	            f.getEmailFileId(),
	            f.getEmailFileName(),
	            f.getEmailFileSize()
	        ))
	        .collect(Collectors.toList());
	    response.setAttachments(attachments);
	    
	    
	    
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
     * 임시저장 메일 발송 시, 임시메일의 상태만 SENT로 변경하고, 내용을 최신화하며, 신규 발송 메일은 새로 생성
	 * @throws IOException 
     */
	/**
	 * 이메일을 DB에 저장(즉시메일/예약메일)합니다.
	 * 임시저장 메일 발송 시, 임시메일의 상태만 SENT 또는 RESERVED로 변경.
	 * 신규 메일은 insert, 첨부/수신자 포함 저장. (SendGrid 등 외부 발송은 아님)
	 * @throws IOException
	 */

    /**
     * 이메일을 DB에 저장(즉시메일/예약메일)합니다.
     */
    @Override
    public EmailResponseDTO sendEmail(EmailSendRequestDTO requestDTO, List<MultipartFile> attachments) throws IOException {
        log.info("[DEBUG] sendEmail: senderId={}, senderAddress={}, requestDTO.getEmailId={}, reservedAt={}",
                requestDTO.getSenderId(), requestDTO.getSenderAddress(), requestDTO.getEmailId(), requestDTO.getReservedAt());

        com.goodee.coreconnect.email.entity.Email savedEmail;

        // 임시저장 메일 발송 분기 (DRAFT → SENT or RESERVED)
        if (requestDTO.getEmailId() != null) {
            com.goodee.coreconnect.email.entity.Email draft = emailRepository
                    .findByEmailIdAndSenderEmailAndEmailStatus(
                            requestDTO.getEmailId(),
                            requestDTO.getSenderAddress(),
                            EmailStatusEnum.DRAFT)
                    .orElseThrow(() -> new IllegalArgumentException("임시보관 메일을 찾을 수 없습니다."));

            draft.setEmailTitle(requestDTO.getEmailTitle());
            draft.setEmailContent(requestDTO.getEmailContent());
            draft.setReservedAt(requestDTO.getReservedAt());
            if (requestDTO.getReservedAt() != null && requestDTO.getReservedAt().isAfter(LocalDateTime.now())) {
                draft.setEmailStatus(EmailStatusEnum.RESERVED);
                draft.setEmailSentTime(null);
                draft.setEmailFolder("RESERVED");
            } else {
                draft.setEmailStatus(EmailStatusEnum.SENT);
                draft.setEmailSentTime(LocalDateTime.now());
                draft.setEmailFolder("SENT");
            }
            savedEmail = emailRepository.save(draft);
        } else {
            // 신규 메일
            com.goodee.coreconnect.email.entity.Email entity = com.goodee.coreconnect.email.entity.Email.builder()
                    .emailTitle(requestDTO.getEmailTitle())
                    .emailContent(requestDTO.getEmailContent())
                    .emailStatus(requestDTO.getReservedAt() != null && requestDTO.getReservedAt().isAfter(LocalDateTime.now())
                        ? EmailStatusEnum.RESERVED : EmailStatusEnum.SENT)
                    .emailSentTime(requestDTO.getReservedAt() == null || !requestDTO.getReservedAt().isAfter(LocalDateTime.now())
                        ? LocalDateTime.now() : null)
                    .senderId(requestDTO.getSenderId())
                    .senderEmail(requestDTO.getSenderAddress())
                    .favoriteStatus(false)
                    .emailDeleteYn(false)
                    .emailSaveStatusYn(false)
                    .emailType(requestDTO.getEmailType())
                    .reservedAt(requestDTO.getReservedAt())
                    .emailFolder(requestDTO.getReservedAt() != null && requestDTO.getReservedAt().isAfter(LocalDateTime.now())
                        ? "RESERVED" : "SENT")
                    .replyToEmailId(requestDTO.getReplyToEmailId())
                    .build();
            savedEmail = emailRepository.save(entity);
        }

        // 첨부파일 저장 (첨부가 있을 경우만)
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                String fileName = file.getOriginalFilename();
                long fileSize = file.getSize();
                String mimeType = file.getContentType();
                String s3key = s3Service.uploadApprovalFile(file);
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

        // 수신자 정보 저장 (TO)
        for (String to : requestDTO.getRecipientAddress()) {
            Optional<User> userOptional = userRepository.findByEmail(to);
            Integer userId = userOptional.map(User::getId).orElse(null);
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
        // 참조 (CC)
        if (requestDTO.getCcAddresses() != null) {
            for (String cc : requestDTO.getCcAddresses()) {
                Optional<User> userOptional = userRepository.findByEmail(cc);
                Integer userId = userOptional.map(User::getId).orElse(null);
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
        // 숨은참조 (BCC)
        if (requestDTO.getBccAddresses() != null) {
            for (String bcc : requestDTO.getBccAddresses()) {
                Optional<User> userOptional = userRepository.findByEmail(bcc);
                Integer userId = userOptional.map(User::getId).orElse(null);
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

        // 결과 DTO 세팅
        EmailResponseDTO resultDTO = new EmailResponseDTO();
        resultDTO.setEmailId(savedEmail.getEmailId());
        resultDTO.setEmailStatus(savedEmail.getEmailStatus().name());
        resultDTO.setEmailTitle(savedEmail.getEmailTitle());
        resultDTO.setEmailContent(savedEmail.getEmailContent());
        return resultDTO;
    }

    /**
     * 예약 시간이 도래한 예약 메일 row를 SENT 상태로 변경하고 발송시각을 업데이트합니다.
     * (새로운 row를 생성하지 않고 예약 메일 row 상태/시각만 update)
     */
    @Override
    public void sendActualMail(com.goodee.coreconnect.email.entity.Email reservedEmail, List<MultipartFile> attachments) {
        // RESERVED 상태일 때만 SENT로 변경
        if (reservedEmail.getEmailStatus() == EmailStatusEnum.RESERVED) {
            reservedEmail.setEmailStatus(EmailStatusEnum.SENT); // 상태 변경
            reservedEmail.setEmailSentTime(LocalDateTime.now()); // 발송 시각 기록
            reservedEmail.setEmailFolder("SENT");
            emailRepository.save(reservedEmail);
            log.info("예약메일(row:{})이 SENT로 처리되고 email_sent_time이 업데이트 됨", reservedEmail.getEmailId());
        } else {
            log.warn("sendActualMail 호출시 이메일이 RESERVED 상태가 아님! (id={}, 현재상태={})", reservedEmail.getEmailId(), reservedEmail.getEmailStatus());
        }
        // 첨부/수신자 정보는 이미 저장되어 있으므로 추가 작업 없음
    }
	
	
	
	
	@Override
    @Transactional
    public boolean markMailAsRead(Integer emailId, String userEmail) {
        // 특정 이메일의 수신자(본인)에 대해 읽음처리 (이미 읽었으면 false)
        com.goodee.coreconnect.email.entity.Email email = emailRepository.findById(emailId)
                .orElseThrow(() -> new IllegalArgumentException("메일이 존재하지 않습니다." + emailId));

        List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(email);

        Optional<EmailRecipient> myRecipientOpt = recipients.stream()
            .filter(r -> userEmail.equals(r.getEmailRecipientAddress()))
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
            return true;
        }
        // 이미 읽은 경우나 못찾은 경우
        return false;
    }

	@Override
	public EmailResponseDTO saveDraft(EmailSendRequestDTO requestDTO, List<MultipartFile> attachments)
			throws IOException {
		 // 메일 본문/제목 등 정보 필요 최소한으로 저장
        com.goodee.coreconnect.email.entity.Email entity = com.goodee.coreconnect.email.entity.Email.builder()
                .emailTitle(requestDTO.getEmailTitle())
                .emailContent(requestDTO.getEmailContent())
                .emailStatus(EmailStatusEnum.DRAFT)
                .emailSentTime(LocalDateTime.now())
                .senderId(requestDTO.getSenderId())
                .senderEmail(requestDTO.getSenderAddress())
                .favoriteStatus(false)
                .emailDeleteYn(false)
                .emailSaveStatusYn(true) // 임시저장
                .emailType(requestDTO.getEmailType())
                .emailFolder("DRAFT")
                .replyToEmailId(requestDTO.getReplyToEmailId())
                .build();

        com.goodee.coreconnect.email.entity.Email savedDraftEmail = emailRepository.save(entity);

        // 수신자 정보 저장 (null/빈배열 허용)
        if (requestDTO.getRecipientAddress() != null) {
            for (String to : requestDTO.getRecipientAddress()) {
                Optional<User> userOptional = userRepository.findByEmail(to);
                Integer userId = userOptional.isPresent() ? userOptional.get().getId() : null;
                EmailRecipient recipient = EmailRecipient.builder()
                        .emailRecipientType("TO")
                        .emailRecipientAddress(to)
                        .userId(userId)
                        .emailReadYn(false)
                        .emailIsAlarmSent(false)
                        .email(savedDraftEmail)
                        .build();
                emailRecipientRepository.save(recipient);
            }
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
                        .email(savedDraftEmail)
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
                        .email(savedDraftEmail)
                        .build();
                emailRecipientRepository.save(bccRecipient);
            }
        }

        // 첨부파일임시저장 (s3 업로드, EmailFile 테이블 저장)
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                String fileName = file.getOriginalFilename();
                long fileSize = file.getSize();
                String mimeType = file.getContentType();
                String s3key = s3Service.uploadApprovalFile(file);
                EmailFile emailFile = EmailFile.builder()
                        .emailFileName(fileName)
                        .emailFileSize(fileSize)
                        .emailFileS3ObjectKey(s3key)
                        .emailFielDeletedYn(false)
                        .email(savedDraftEmail)
                        .build();
                emailFileRepository.save(emailFile);
            }
        }

        // Redis 카운트(개수) 무효화 처리(삭제)
        removeDraftCountCache(savedDraftEmail.getSenderEmail());

        // 결과 DTO 반환
        EmailResponseDTO resultDTO = new EmailResponseDTO();
        resultDTO.setEmailId(savedDraftEmail.getEmailId());
        resultDTO.setEmailStatus("DRAFT");
        resultDTO.setEmailTitle(savedDraftEmail.getEmailTitle());
        resultDTO.setEmailContent(savedDraftEmail.getEmailContent());
        return resultDTO;
	}

	@Override
	public Page<EmailResponseDTO> getDraftbox(String userEmail, int page, int size) {
		Pageable pageable = PageRequest.of(page, size);
	    // 1. 임시저장(DRAFT) 메일만, 본인이 '발신자'인 경우만!
	    Page<com.goodee.coreconnect.email.entity.Email> draftPage = emailRepository.findBySenderEmailAndEmailStatus(
	            userEmail, EmailStatusEnum.DRAFT, pageable);

	    List<EmailResponseDTO> dtoList = draftPage.stream().map(email -> {
	        EmailResponseDTO dto = new EmailResponseDTO();
	        dto.setEmailId(email.getEmailId());
	        dto.setEmailTitle(email.getEmailTitle());
	        dto.setEmailContent(email.getEmailContent());
	        dto.setSenderId(email.getSenderId());
	        dto.setSenderEmail(email.getSenderEmail());
	        dto.setSentTime(email.getEmailSentTime());
	        dto.setEmailStatus(email.getEmailStatus().name()); // DRAFT
	        dto.setReplyToEmailId(email.getReplyToEmailId());

	        // 받는 사람 (TO/CC/BCC)
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
	        dto.setRecipientAddresses(toAddresses);
	        dto.setCcAddresses(ccAddresses);
	        dto.setBccAddresses(bccAddresses);

	        // 첨부파일 정보
	        List<EmailFile> files = emailFileRepository.findByEmail(email);
	        List<Integer> fileIds = files.stream()
	                .map(EmailFile::getEmailFileId)
	                .collect(Collectors.toList());
	        dto.setFileIds(fileIds);

	        return dto;
	    }).collect(Collectors.toList());

	    // 반환
	    return new PageImpl<>(dtoList, pageable, draftPage.getTotalElements());
	}

	@Override
	public long getDraftCount(String userEmail) {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public EmailResponseDTO getDraftDetail(Integer draftId, String userEmail) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean deleteDraft(Integer draftId) {
		// TODO Auto-generated method stub
		return false;
	}

	// 레디스 캐시 삭제 함수 (DRY)
    private void removeDraftCountCache(String userEmail) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete("draft_count:" + userEmail);
            } catch (Exception e) {
                log.warn("[Redis] draft_count:{} 삭제 실패: {}", userEmail, e.getMessage());
            }
        }
    }

    /**
     * 임시저장 메일 상세조회 구현
     * @param draftId 임시메일 ID
     * @param userEmail 메일 소유자(로그인 사용자)
     * @return 상세 DTO (제목/본문/수신참조/bcc/첨부 등 모두 포함)
     */
    @Override
    public EmailResponseDTO getDraftMailDetail(Integer draftId, String userEmail) {
        // 1. 임시메일 엔티티({draftId, userEmail, 상태: DRAFT}) 조건으로 조회
    	com.goodee.coreconnect.email.entity.Email draftOpt = emailRepository
    	        .findByEmailIdAndSenderEmailAndEmailStatus(
    	            draftId, userEmail, EmailStatusEnum.DRAFT
    	        )
    	        .orElseThrow(() -> new IllegalArgumentException("임시보관 메일을 찾을 수 없습니다."));

    	com.goodee.coreconnect.email.entity.Email draft = emailRepository
    	        .findByEmailIdAndSenderEmailAndEmailStatus(
    	            draftId, userEmail, EmailStatusEnum.DRAFT
    	        )
    	        .orElseThrow(() -> new IllegalArgumentException("임시보관 메일을 찾을 수 없습니다."));
    	
    	// 2. 기본 메일 정보 셋팅
        EmailResponseDTO dto = new EmailResponseDTO();
        dto.setEmailId(draft.getEmailId());
        dto.setEmailTitle(draft.getEmailTitle());
        dto.setEmailContent(draft.getEmailContent());
        dto.setSenderId(draft.getSenderId());
        dto.setSenderEmail(draft.getSenderEmail());
        dto.setSentTime(draft.getEmailSentTime());
        dto.setEmailStatus(draft.getEmailStatus().name());
       
        // 3. 수신/참조/숨은참조 정보
        List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(draft);
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

        dto.setRecipientAddresses(toAddresses);
        dto.setCcAddresses(ccAddresses);
        dto.setBccAddresses(bccAddresses);

        // 4. 첨부파일 정보
        List<EmailFile> files = emailFileRepository.findByEmail(draft);
        List<EmailResponseDTO.AttachmentDTO> attachments = files.stream()
                .map(f -> new EmailResponseDTO.AttachmentDTO(
                        f.getEmailFileId(),
                        f.getEmailFileName(),
                        f.getEmailFileSize()
                )).collect(Collectors.toList());
        dto.setAttachments(attachments);
        dto.setFileIds(files.stream().map(EmailFile::getEmailFileId).collect(Collectors.toList()));
        
        // 5. 기타 필드 세팅
        dto.setReplyToEmailId(draft.getReplyToEmailId());
        
        return dto;
    }

    /**
     * 임시저장(DRAFT) 상태의 메일만 삭제
     */
    @Override
    @Transactional
    public void deleteDraftMail(Integer draftId) {
    	com.goodee.coreconnect.email.entity.Email draft = emailRepository.findById(draftId)
    	        .orElseThrow(() -> new IllegalArgumentException("임시저장 메일을 찾을 수 없습니다."));
    	    if (draft.getEmailStatus() != EmailStatusEnum.DRAFT) {
    	        throw new IllegalStateException("임시저장 상태(DRAFT) 메일만 삭제할 수 있습니다.");
    	    }
    	    // 실제 삭제(X), 상태값만 변경
    	    draft.setEmailStatus(EmailStatusEnum.DELETED);
    	    // 필요시 삭제 시각 등 기록
    	    draft.setEmailDeletedTime(LocalDateTime.now());
    	    log.info("삭제 draft: {}", draft);
    	    emailRepository.save(draft);
    }

    @Override
    @Transactional
    public void moveEmailsToTrash(List<Integer> emailIds, String userEmail) {
        if (CollectionUtils.isEmpty(emailIds)) {
            return;
        }
        // 조건 없이 모든 emailIds를 allowed에 복사
        List<Integer> allowed = new ArrayList<>(emailIds);

        if (!allowed.isEmpty()) {
            int updated = emailRepository.updateEmailStatusByIds(allowed, EmailStatusEnum.TRASH);
            log.info("moveEmailsToTrash: updated {} rows to TRASH for user {}", updated, userEmail);
        }
    }

    @Override
    @Transactional
    public void emptyTrash(String userEmail) {
        if (userEmail == null) return;
        // 1) 이메일 발신자(userEmail)인 것들 중 상태가 TRASH인 id
        Iterable<com.goodee.coreconnect.email.entity.Email> senderEmailsIterable = emailRepository.findAll(); // 작은 규모 가정. 필요시 커스텀 쿼리로 최적화
        Set<Integer> toDelete = new HashSet<>();
        for (com.goodee.coreconnect.email.entity.Email e : senderEmailsIterable) {
            if (e.getEmailStatus() == EmailStatusEnum.TRASH) {
                if (userEmail.equals(e.getSenderEmail())) {
                    toDelete.add(e.getEmailId());
                }
            }
        }
        // 2) 수신자로서 포함된 이메일 id들 중 상태가 TRASH인 것들
        List<Integer> recipientIds = emailRecipientRepository.findEmailIdsByRecipientAddress(userEmail);
        if (!CollectionUtils.isEmpty(recipientIds)) {
            for (Integer id : recipientIds) {
                emailRepository.findById(id).ifPresent(e -> {
                    if (e.getEmailStatus() == EmailStatusEnum.TRASH) {
                        toDelete.add(id);
                    }
                });
            }
        }
        if (!toDelete.isEmpty()) {
            int updated = emailRepository.updateEmailStatusByIds(new ArrayList<>(toDelete), EmailStatusEnum.DELETED);
            log.info("emptyTrash: marked {} emails as DELETED for user {}", updated, userEmail);
        }
    }

	
	
	
}
