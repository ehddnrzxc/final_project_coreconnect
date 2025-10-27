package com.goodee.coreconnect.scheule.entity;

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
import lombok.Setter;

@Entity
@Table(name = "schedule_category")
@Getter
@Setter
public class ScheduleCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "sch_category_id")
  private Long id;

  @Column(name = "sch_category_name", length = 50, nullable = false)
  private String name;

  @Column(name = "sch_category_default_yn")
  private Boolean defaultYn;  // 기본 카테고리 여부

  @Column(name = "sch_category_created_at")
  private LocalDate createdAt;

  @Column(name = "sch_category_updated_at")
  private LocalDate updatedAt;

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
    category.createdAt = LocalDate.now();
    return category;
  }

  
}
