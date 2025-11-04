package com.goodee.coreconnect.approval.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.Template;

public interface TemplateRepository extends JpaRepository<Template, Integer>{
  
  /**
   * 활성화된 템플릿(양식)만 조회
   * @return
   */
  List<Template> findByActiveYnTrueOrderByTemplateNameAsc();
  
  /**
   * Key의 존재 여부 확인
   * @param templateKey
   * @return
   */
  boolean existsByTemplateKey(String templateKey);
  
  /**
   * Key로 템플릿 조회
   * @param templateKey
   * @return
   */
  Optional<Template> findByTemplateKey(String templateKey);

}
