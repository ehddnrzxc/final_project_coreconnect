package com.goodee.coreconnect.user.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.department.entity.Department;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) 
@Table(
    name = "users",
    indexes = @Index(name = "idx_user_email", columnList = "user_email"),
    uniqueConstraints = @UniqueConstraint(name = "uk_user_email", columnNames = "user_email")
)
public class User {

    // ─────────────── 기본 속성 ───────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "user_password", length = 100, nullable = false)
    private String password;

    @Column(name = "user_name", length = 255, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", length = 10, nullable = false)
    private Role role; // ADMIN / MANAGER / USER

    @Column(name = "user_email", length = 255, nullable = false)
    private String email;

    @Column(name = "user_phone", length = 15)
    private String phone;

    @Column(name = "user_join_date")
    private LocalDateTime joinDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_status", length = 20, nullable = false)
    private Status status; // ACTIVE, INACTIVE

    @Column(name = "profile_image_key")
    private String profileImageKey;

    // ─────────────── 연관관계 매핑 ───────────────
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatRoomUser> chatRoomUsers = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Document> documents = new ArrayList<>();

    @OneToMany(mappedBy = "approver")
    private List<ApprovalLine> approvalLines = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Template> templates = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.PERSIST, orphanRemoval = true)
    private List<Board> boards = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;


    // ─────────────── 생성 메서드 ───────────────
    public static User createUser(
            String password,
            String name,
            Role role,
            String email,
            String phone,
            Department department
    ) {
        User user = new User();
        user.password = password;
        user.name = name;
        user.role = role;
        user.email = email;
        user.phone = phone;
        user.department = department;
        user.joinDate = LocalDateTime.now();
        user.status = Status.ACTIVE;
        return user;
    }


    // ─────────────── 연관관계 편의 메서드 ───────────────

    /** 게시글 추가 */
//    public void addBoard(Board board) {
//        if (board == null) return;
//        boards.add(board);
//        board.assignUser(this); 
//    }
//
//    /** 결재문서 추가 */
//    public void addDocument(Document document) {
//        if (document == null) return;
//        documents.add(document);
//        document.assignUser(this);
//    }
//
//    /** 결재선 추가 */
//    public void addApprovalLine(ApprovalLine line) {
//        if (line == null) return;
//        approvalLines.add(line);
//        line.assignApprover(this);
//    }
//
//    /** 결재 양식(템플릿) 추가 */
//    public void addTemplate(Template template) {
//        if (template == null) return;
//        templates.add(template);
//        template.assignUser(this);
//    }
//
//    /** 채팅방 참여자 추가 */
//    public void addChatRoomUser(ChatRoomUser chatRoomUser) {
//        if (chatRoomUser == null) return;
//        chatRoomUsers.add(chatRoomUser);
//        chatRoomUser.assignUser(this);
//    }
//
    /** 부서 변경 */
    public void changeDepartment(Department department) {
        if (this.department != null) {
            this.department.getUsers().remove(this);
        }
        this.department = department;
        if (department != null) {
            department.getUsers().add(this);
        }
    }


    // ─────────────── 도메인 행위 ───────────────

    /** 회원 비활성화 */
    public void deactivate() {
        this.status = Status.INACTIVE;
    }

    /** 프로필 이미지 변경 */
    public void updateProfileImage(String imageKey) {
        this.profileImageKey = imageKey;
    }

    /** 비밀번호 변경 */
    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    /** 전화번호 변경 */
    public void changePhone(String newPhone) {
        this.phone = newPhone;
    }
}
