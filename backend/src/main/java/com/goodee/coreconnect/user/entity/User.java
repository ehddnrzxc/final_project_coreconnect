package com.goodee.coreconnect.user.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.user.enums.JobGrade;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.enums.Status;
import com.goodee.coreconnect.user.repository.UserRepository;

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
import jakarta.persistence.OneToOne;
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

    @Column(name = "user_profile_image_key")
    private String profileImageKey;

    @Column(name = "user_employee_number", length = 10, unique = true)
    private String employeeNumber;

    @OneToOne(mappedBy = "user", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private UserDetailProfile userDetailProfile;

    // ─────────────── 연관관계 매핑 ───────────────
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatRoomUser> chatRoomUsers = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Document> documents = new ArrayList<>();

    @OneToMany(mappedBy = "approver")
    private List<ApprovalLine> approvalLines = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Template> templates = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Board> boards = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;
    
    // (추가) 내가 만든 채팅방 리스트 (개설자 기준)
    @OneToMany(mappedBy = "drafter")
    private List<ChatRoom> createdChatRooms = new ArrayList<>();
    
    // 직급
    @Enumerated(EnumType.STRING)
    @Column(name = "user_rank", length = 20)
    private JobGrade jobGrade;
    
    // ─────────────── 생성 메서드 ───────────────
    public static User createUser(
            String password,
            String name,
            Role role,
            String email,
            String phone,
            Department department,
            JobGrade jobGrade,
            String employeeNumber
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
        user.jobGrade = jobGrade;
        user.employeeNumber = employeeNumber;
        return user;
    }


    // ─────────────── 연관관계 편의 메서드 ───────────────

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
    
    /** 직급 변경 */
    public void changeJobGrade(JobGrade jobGrade) {
      if(jobGrade != null) {
        this.jobGrade = jobGrade;
      }
    }

    /** 권한(Role) 변경 */
    public void changeRole(Role newRole) {
      if (newRole != null) {
        this.role = newRole;
      }
    }

    
    // ─────────────── 도메인 행위 ───────────────

    /** 회원 비활성화 */
    public void deactivate() {
        this.status = Status.INACTIVE;
    }
    /** 회원 재활성화 */
    public void activate() {
      this.status = Status.ACTIVE;
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
    
    /** 이메일 변경 */
    public void changeEmail(String newEmail) {
        if (newEmail != null && !newEmail.isBlank()) {
            this.email = newEmail;
        }
    }
    
    /** 이름 변경 */
    public void changeName(String newName) {
        if (newName != null && !newName.isBlank()) {
            this.name = newName;
        }
    }
    
    
 // ─────────────── 편의(인증) 메서드 ───────────────

    /**
     * 현재 SecurityContext에 설정된 인증(Authentication)의 principal(name)을 반환합니다.
     * 보통 principal은 사용자 이메일을 의미합니다.
     *
     * @return 인증된 principal (email) 또는 null (인증 정보가 없거나 anonymous)
     */
    public static String getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        String name = auth.getName();
        if (name == null || name.trim().isEmpty()) return null;
        return name;
    }

    /**
     * 현재 인증된 사용자의 User 엔티티를 UserRepository를 통해 조회하여 반환합니다.
     * 이 편의 메서드는 repository를 파라미터로 받아 사용하므로 엔티티 내부에서 스프링 빈을 직접 사용하지 않습니다.
     *
     * 사용 예:
     *   User user = User.getAuthenticatedUser(userRepository);
     *
     * @param userRepository UserRepository 인스턴스
     * @return User 엔티티 또는 null (인증 정보 없음 또는 DB에 사용자 없음)
     */
    public static User getAuthenticatedUser(UserRepository userRepository) {
        String email = getAuthenticatedUser();
        if (email == null) return null;
        return userRepository.findByEmail(email).orElse(null);
    }
    
    
}
