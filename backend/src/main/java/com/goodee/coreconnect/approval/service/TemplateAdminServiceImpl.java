package com.goodee.coreconnect.approval.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.approval.dto.request.TemplateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.approval.repository.TemplateRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TemplateAdminServiceImpl implements TemplateAdminService {

  private final TemplateRepository templateRepository;
  private final UserRepository userRepository;

  //==== Email로 User 찾는 헬퍼메소드와 Id로 Template 찾는 헬퍼메소드 =====//
  private User findUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
  }
  private Template findTemplateById(Integer tempId) {
    return templateRepository.findById(tempId)
        .orElseThrow(() -> new EntityNotFoundException("템플릿(양식)을 찾을 수 없습니다."));
  }

  /**
   * 새 양식 생성 (관리자)
   */
  @Override
  public Integer createTemplate(TemplateRequestDTO requestDTO, String adminEmail) {

    User admin = findUserByEmail(adminEmail);

    if (templateRepository.existsByTemplateKey(requestDTO.getTemplateKey())) {
      throw new IllegalArgumentException("이미 사용 중인 양식 Key입니다.");
    }

    Template newTemplate = requestDTO.toEntity(admin);

    Template savedTemplate = templateRepository.save(newTemplate);
    return savedTemplate.getId();
  }

  /**
   * 전체 양식 목록 조회 (관리자용 - 활성화/비활성화 모두)
   */
  @Override
  @Transactional(readOnly = true)
  public List<TemplateSimpleResponseDTO> getAllTemplates() {

    List<Template> templates = templateRepository.findAll();

    return templates.stream()
        .map(TemplateSimpleResponseDTO::toDTO) 
        .collect(Collectors.toList());
  }

  /**
   * 양식 상세 조회 (관리자)
   */
  @Override
  @Transactional(readOnly = true)
  public TemplateDetailResponseDTO getTemplateDetail(Integer templateId) {
    Template template = findTemplateById(templateId);
    return TemplateDetailResponseDTO.toDTO(template);
  }

  /**
   * 양식 수정 (관리자)
   */
  @Override
  public void updateTemplate(Integer templateId, TemplateRequestDTO requestDTO) {
    // 영속성 컨텍스트에 엔티티 로드
    Template template = findTemplateById(templateId);

    templateRepository.findByTemplateKey(requestDTO.getTemplateKey()).ifPresent(t -> {
      if (!t.getId().equals(template.getId())) {
        throw new IllegalArgumentException("이미 사용 중인 양식 Key입니다.");
      }
    });
    
    // 엔티티의 update 메소드 호출 (JPA 더티 체킹)
    template.updateTemplate(
        requestDTO.getTemplateName(),
        requestDTO.getTemplateKey(),
        requestDTO.getTemplateContent()
        );
  }

  /**
   * 양식 비활성화 (관리자)
   */
  @Override
  public void deactivateTemplate(Integer templateId) {
    Template template = findTemplateById(templateId);
    template.deactivate(); // 더티 체킹
  }

  /**
   * 양식 활성화 (관리자)
   */
  @Override
  public void activateTemplate(Integer templateId) {
    Template template = findTemplateById(templateId);
    template.activate(); // 더티 체킹
  }

}
