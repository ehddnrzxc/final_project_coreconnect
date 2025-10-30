package com.goodee.coreconnect.approval.service;

import java.util.List;

import com.goodee.coreconnect.approval.dto.request.TemplateCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.request.TemplateUpdateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;

public interface TemplateAdminService {

  /**
   * 새 양식 생성 (관리자)
   * @param requestDTO
   * @param adminEmail
   * @return
   */
  Integer createTemplate(TemplateCreateRequestDTO requestDTO, String adminEmail);
  
  /**
   * 전체 양식 목록 조회 (관리자용 - 활성화/비활성화 모구)
   * @return
   */
  List<TemplateSimpleResponseDTO> getAllTemplates();
  
  /**
   * 양식 상세 조회 (관리자용)
   * @param templateId
   * @return
   */
  TemplateDetailResponseDTO getTemplateDetail(Integer templateId);
  
  /**
   * 양식 수정 (관리자)
   * @param templateId
   * @param requestDTO
   */
  void updateTemplate(Integer templateId, TemplateUpdateRequestDTO requestDTO);
  
  /**
   * 양식 비활성화 (관리자)
   * @param templateId
   */
  void deactivateTemplate(Integer templateId);
  
  /**
   * 양식 활성화 (관리자)
   * @param templateId
   */
  void activateTemplate(Integer templateId);
  
}
