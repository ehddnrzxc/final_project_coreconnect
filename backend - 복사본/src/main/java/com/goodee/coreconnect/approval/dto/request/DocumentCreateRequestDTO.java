package com.goodee.coreconnect.approval.dto.request;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DocumentCreateRequestDTO {
  
  /**
   * 사용할 템플릿 ID
   */
  private Integer templateId;
  
  /**
   * 문서 제목
   */
  private String documentTitle;
  
  /**
   * 문서 내용
   */
  private String documentContent;
  
  /**
   * 결재선에 포함될 사용자의 ID 목록 (순서대로)
   */
  private List<Integer> approvalIds;

}
