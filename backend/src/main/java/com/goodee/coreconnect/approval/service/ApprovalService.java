package com.goodee.coreconnect.approval.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.approval.dto.request.ApprovalProcessRequestDTO;
import com.goodee.coreconnect.approval.dto.request.DocumentCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;

public interface ApprovalService {

  /**
   * 새 결재 문서를 상신합니다.
   * @param requestDTO 문서 생성 요청
   * @param email 상신하는 사용자 email
   * @return 생성된 문서 ID
   */
  Integer createDocument(DocumentCreateRequestDTO requestDTO, List<MultipartFile> files, String email);

  /**
   * 내 상신함(내가 작성한 문서) 목록을 조회합니다.
   * @param email 현재 사용자 email
   * @return 문서 목록
   */
  List<DocumentSimpleResponseDTO> getMyDrafts(String email);

  /**
   * 내 결재함(내가 결재할 문서) 목록을 조회합니다.
   * @param email 현재 사용자 email
   * @return 문서 목록
   */
  List<DocumentSimpleResponseDTO> getMyTasks(String email);

  /**
   * 문서 상세 내용을 조회합니다.
   * @param documentId 조회할 문서 ID
   * @param email 현재 사용자 email (열람 권한 확인용)
   * @return 문서 상세 DTO
   */
  DocumentDetailResponseDTO getDocumentDetail(Integer documentId, String email);

  /**
   * 문서를 승인합니다.
   * @param documentId 승인할 문서 ID
   * @param requestDTO 결재 의견 DTO
   * @param email 승인하는 사용자 email
   */
  void approveDocument(Integer documentId, ApprovalProcessRequestDTO requestDTO, String email);

  /**
   * 문서를 반려합니다.
   * @param documentId 반려할 문서 ID
   * @param requestDTO 결재 의견 DTO
   * @param email 반려하는 사용자 email
   */
  void rejectDocument(Integer documentId, ApprovalProcessRequestDTO requestDTO, String email);
  
  /**
   * 활성화된 모든 양식(템플릿) 목록을 조회합니다.
   * @return 템플릿 목록
   */
  List<TemplateSimpleResponseDTO> getActiveTemplates();
  
  /**
   * 특정 양식(템플릿)의 상세 내용을 조회합니다.
   * @param templateId 템플릿 ID
   * @return 템플릿 상세 DTO
   */
  TemplateDetailResponseDTO getTemplateDetail(Integer templateId);
  
}
