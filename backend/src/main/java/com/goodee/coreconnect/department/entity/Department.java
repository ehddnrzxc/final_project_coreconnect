package com.goodee.coreconnect.department.entity;

import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "department")
public class Department {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "dept_id")
  private Integer id;
  
  @Column(name = "dept_name", length = 50, nullable = false)
  private String deptName;
  
  @Column(name = "dept_order_no", nullable = false)
  private Integer deptOrderNo;
  
  /**
   * users 테이블과 1:N 연관관계 매핑
   * User 엔티티의 필드명: department
   */
  @OneToMany(mappedBy = "department")
  private List<User> users = new ArrayList<>();

}
