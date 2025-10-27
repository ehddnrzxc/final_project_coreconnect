package com.goodee.coreconnect.user.entity;

import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Table(
    name = "users", 
    indexes = {
        @Index(name = "idx_user_email", columnList = "user_email"),
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_email", columnNames = "user_email")
    }
    )
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_id")
  private Integer id;

  // BCrypt 저장 (보통 60자) — 스키마를 VARCHAR(60) 이상으로 맞추세요
  @Column(name = "user_password", length = 100, nullable = false)
  private String password;

  @Column(name = "user_name", length = 255, nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "user_role", length = 10, nullable = false)
  private Role role; // ADMIN / MANAGER / USER 등

  @Column(name = "user_email", length = 255, nullable = false)
  private String email;

  @Column(name = "user_phone", length = 15)
  private String phone;

  @Column(name = "user_join_date")
  private LocalDateTime joinDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "user_status", length = 20, nullable = false)
  private Status status; // ACTIVE, INACTIVE 등

  @Column(name = "profile_image_key")
  private String profileImageKey;

  public enum Role { ADMIN, MANAGER, USER }
  public enum Status { ACTIVE, INACTIVE }


  // 1:N 관계 매핑 (chat_room_user 테이블과 매핑)
  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
  private List<ChatRoomUser> chatRoomUsers = new ArrayList<>();

  /**
   * 사용자가 '작성한(상신한)' 문서 목록입니다.
   * (Document 엔티티의 'user' 필드와 매핑)
   */
  @OneToMany(mappedBy = "user")
  private List<Document> documents = new ArrayList<>();

  /**
   * 사용자가 '결재해야 하거나 결재한' 결재선 목록입니다.
   * (ApprovalLine 엔티티의 'approver' 필드와 매핑)
   */
  @OneToMany(mappedBy = "approver")
  private List<ApprovalLine> approvalLines = new ArrayList<>();

  /**
   * 사용자가 '생성한' 결재 양식(템플릿) 목록입니다.
   * (Template 엔티티의 'user' 필드와 매핑)
   */
  @OneToMany(mappedBy = "user")
  private List<Template> templates = new ArrayList<>();

  /**
   * 1:N 관계 매핑 (board 테이블과 매핑)
   */
  @OneToMany(mappedBy = "user", cascade = CascadeType.PERSIST, orphanRemoval = true)
  private List<Board> boards = new ArrayList<>();

}