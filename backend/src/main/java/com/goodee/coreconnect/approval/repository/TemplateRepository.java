package com.goodee.coreconnect.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.Template;

public interface TemplateRepository extends JpaRepository<Template, Integer>{
  
  /**
   * 활성화된 템플릿(양식)만 조회
   * @return
   */
  List<Template> findByActiveYnTrueOrderByTemplateNameAsc();

}
