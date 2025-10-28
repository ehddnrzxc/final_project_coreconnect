package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDate;

import com.goodee.coreconnect.user.entity.User;

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
@Table(name = "schedule_category")
@Getter
public class ScheduleCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "sch_category_id")
  private Integer id;

  @Column(name = "sch_category_name", length = 50, nullable = false)
  private String name;

  @Column(name = "sch_category_default_yn", nullable = false)
  private Boolean defaultYn;  // 기본 카테고리 여부
  
  @Column(name = "sch_category_deleted_yn", nullable = false)
  private Boolean deletedYn = false;  // 삭제 여부 (기본값 false)

  @Column(name = "sch_category_created_at", nullable = false)
  private LocalDate createdAt;

  @Column(name = "sch_category_updated_at")
  private LocalDate updatedAt;

  /**
   * N:1 (user 테이블과 매핑)
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;
  
  protected ScheduleCategory() {};
  
  public static ScheduleCategory createScheduleCategory(User user,
                                                          String name, 
                                                          boolean defaultYn) {
    ScheduleCategory category = new ScheduleCategory();
    category.user = user;
    category.name = name;
    category.defaultYn = defaultYn;
    category.deletedYn = false;
    category.createdAt = LocalDate.now();
    return category;
  }

  /** 카테고리 이름 변경 */
  public void rename(String name) {
    this.name = name;
    this.updatedAt = LocalDate.now();
  }

  /** 기본 카테고리 여부 변경 */
  public void changeDefault(boolean defaultYn) {
    this.defaultYn = defaultYn;
    this.updatedAt = LocalDate.now();
  }

  /** 카테고리 삭제(delete) */
  public void delete() {
    this.deletedYn = true;
    this.updatedAt = LocalDate.now();
  }
  
}
