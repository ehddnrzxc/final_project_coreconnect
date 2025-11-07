package com.goodee.coreconnect.email.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTo;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;

public interface EmailService {

	/**
     * 이메일을 전송(발송)합니다.
     * @param requestDTO 이메일 전송 요청 DTO (제목/내용/수신자/참조/숨은참조/첨부/답신정보 등)
     * @return EmailResponseDTO 발송된 이메일 상세정보/상태/결과
     */
	EmailResponseDTO sendEmail(EmailSendRequestDTo requestDTO, List<MultipartFile> attachments) throws IOException; 
	
	/**
     * 특정 이메일의 상세 정보를 조회합니다.
     * @param emailId 이메일 고유 ID
     * @return EmailResponseDTO 해당 이메일의 상세 정보 (제목/내용/첨부/참조자/답신 등)
     */
	EmailResponseDTO getEmailDetail(Integer emailId);
	
	
	/**
     * 발신함(보낸메일함) 리스트를 페이징으로 조회합니다.
     * @param userId 사용자 고유 ID (로그인된 사용자)
     * @param page 페이징 페이지 번호
     * @param size 한 페이지당 아이템 수
     * @return Page<EmailResponseDTO> 페이징된 EmailResponseDTO 리스트
     */
	Page<EmailResponseDTO> getInbox(Integer userId, int page, int size);
	
	/**
     * 발신함(보낸메일함) 리스트를 페이징으로 조회합니다.
     * @param userId 사용자 고유 ID (로그인된 사용자)
     * @param page 페이징 페이지 번호
     * @param size 한 페이지당 아이템 수
     * @return Page<EmailResponseDTO> 페이징된 EmailResponseDTO 리스트
     */
	Page<EmailResponseDTO> getSentbox(Integer userId, int page, int size);
	
	 /**
     * 반송함(실패/반송된 메일함) 리스트를 페이징으로 조회합니다.
     * @param userId 사용자 고유 ID
     * @param page 페이징 페이지 번호
     * @param size 한 페이지당 아이템 수
     * @return Page<EmailResponseDTO> 페이징된 EmailResponseDTO 리스트
     */
	Page<EmailResponseDTO> getBounceBox(Integer userId, int page, int size);
}
