package com.goodee.coreconnect.approval.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Getter
@Access(AccessType.FIELD)
@Table(name = "template")
public class Template {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "temp_id")
  private Integer id;
  
  @Column(name = "temp_name", nullable = false, length = 100)
  private String templateName;
  
  @Column(name = "temp_html_content", columnDefinition = "TEXT")
  private String templateHtmlContent;
  
  @Column(name = "temp_key", nullable = false, length = 50, unique = true)
  private String templateKey;
  
  @Column(name = "temp_active_yn", nullable = false)
  private boolean activeYn = true;
  
  @CreationTimestamp
  @Column(name = "temp_created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;
  
  protected Template() {};
  
  /**
   * 새로운 템플릿(양식)을 생성하는 메소드
   * @param templateName
   * @param templateContent
   * @param user
   * @return
   */
  public static Template createTemplate(String templateName, String templateHtmlContent, String templateKey, User user) {
    Template t = new Template();
    t.templateName = templateName;
    t.templateHtmlContent = templateHtmlContent;
    t.templateKey = templateKey;
    t.user = user;
    return t;
  }
  
  /**
   * 템플릿(양식)의 이름과 내용을 수정하는 메소드
   * @param newName
   * @param newContent
   */
  public void updateTemplate(String newName, String newHtmlContent, String newKey) {
    this.templateName = newName;
    this.templateHtmlContent = newHtmlContent;
    this.templateKey = newKey;
  }
  
  /**
   * 템플릿(양식)을 비활성화 상태로 변경하는 메소드
   * (더 이상 문서 작성 시 양식 목록에 나타나지 않음)
   */
  public void deactivate() {
    this.activeYn = false;
  }
  
  /**
   * 템플릿(양식)을 활성 상태로 변경하는 메소드
   */
  public void activate() {
    this.activeYn = true;
  }

  public Object getName() {
	// TODO Auto-generated method stub
	return null;
  }
  
}
