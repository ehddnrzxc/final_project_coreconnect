package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.ToString;

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
  
  @Column(name = "sch_category_deleted_yn", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
  private Boolean deletedYn = false;  // 삭제 여부 (기본값 false)

  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  @Column(name = "sch_category_created_at", nullable = false)
  private LocalDateTime createdAt;

  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  @Column(name = "sch_category_updated_at")
  private LocalDateTime updatedAt;

  /** N:1 (user 테이블과 매핑) */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;
  
  /** 1:N (schedule 테이블과 매핑) 
   * @ToString.Exclude : 
   *   - Lombok의 toString() 생성 시 schedules 필드를 제외.
   *   - Category ↔ Schedule 양방향 참조 시 무한 순환(toString 재귀 호출) 방지용.
   *
   * @JsonIgnore : 
   *   - JSON 직렬화(Jackson 변환) 시 schedules 필드를 무시.
   *   - REST API 응답 변환 시 Category → Schedule → Category ... 무한 순환 방지.
   * */
  @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
  @ToString.Exclude
  @JsonIgnore
  private List<Schedule> schedules = new ArrayList<>();
  
  
  protected ScheduleCategory() {};
  
  public static ScheduleCategory createScheduleCategory(User user,
                                                          String name, 
                                                          boolean defaultYn) {
    ScheduleCategory category = new ScheduleCategory();
    category.user = user;
    category.name = name;
    category.defaultYn = defaultYn;
    category.deletedYn = false;
    category.createdAt = LocalDateTime.now();
    return category;
  }

  /** 카테고리 이름 변경 */
  public void rename(String name) {
    this.name = name;
    this.updatedAt = LocalDateTime.now();
  }

  /** 기본 카테고리 여부 변경 */
  public void changeDefault(boolean defaultYn) {
    this.defaultYn = defaultYn;
    this.updatedAt = LocalDateTime.now();
  }

  /** 카테고리 삭제(delete) */
  public void delete() {
    this.deletedYn = true;
    this.updatedAt = LocalDateTime.now();
  }
  
  /** 카테고리 삭제 시 해당 일정도 Soft Delete 처리 */
  public void deleteWithSchedules() {
    if (schedules != null && !schedules.isEmpty()) {
      schedules.forEach(Schedule::deleteWithParticipants); // Schedule 엔티티의 deleteWithParticipants() 메서드 호출
    }
    this.deletedYn = true;
    this.updatedAt = LocalDateTime.now();
  }
  
}
