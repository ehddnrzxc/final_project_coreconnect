package com.goodee.coreconnect.dashboard.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // ✅ JPA용 기본 생성자 보호
@Table(
    name = "dashboard",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_dashboard_user_date", columnNames = {"user_id", "dash_date"})
    },
    indexes = {
        @Index(name = "idx_dashboard_user", columnList = "user_id"),
        @Index(name = "idx_dashboard_date", columnList = "dash_date")
    }
)
public class Dashboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dash_id")
    private Integer dashId;

    @Column(name = "dash_date", nullable = false)
    private LocalDate dashDate;               // 기준일 (오늘자)

    @Column(name = "dash_work_time")
    private Integer workTime;                 // 근무시간(분)

    @Column(name = "dash_late_count")
    private Integer lateCount;                // 지각 횟수

    @Column(name = "dash_absent_count")
    private Integer absentCount;              // 결근 횟수

    @Column(name = "dash_unread_count")
    private Integer unreadCount;              // 안 읽은 공지 수

    @Column(name = "dash_pending_approvals")
    private Integer pendingApprovals;         // 결재 대기 문서 수

    @Column(name = "dash_updated_at")
    private LocalDateTime updatedAt;          // 마지막 업데이트 시점

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    // ───────────────────────────────
    // ✅ 정적 팩토리 메서드
    // ───────────────────────────────
    public static Dashboard createDashboard(User user, LocalDate dashDate) {
        Dashboard dashboard = new Dashboard();
        dashboard.user = user;
        dashboard.dashDate = dashDate;
        dashboard.workTime = 0;
        dashboard.lateCount = 0;
        dashboard.absentCount = 0;
        dashboard.unreadCount = 0;
        dashboard.pendingApprovals = 0;
        dashboard.updatedAt = LocalDateTime.now();
        return dashboard;
    }

    // ───────────────────────────────
    // ✅ 도메인 행위 (업데이트 로직)
    // ───────────────────────────────

    /** 근무 시간 누적 (분 단위) */
    public void addWorkTime(int minutes) {
        this.workTime = (this.workTime == null ? 0 : this.workTime) + minutes;
        this.updatedAt = LocalDateTime.now();
    }

    /** 지각 횟수 증가 */
    public void incrementLateCount() {
        this.lateCount = (this.lateCount == null ? 0 : this.lateCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }

    /** 결근 횟수 증가 */
    public void incrementAbsentCount() {
        this.absentCount = (this.absentCount == null ? 0 : this.absentCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }

    /** 읽지 않은 공지 개수 변경 */
    public void updateUnreadCount(int newCount) {
        this.unreadCount = newCount;
        this.updatedAt = LocalDateTime.now();
    }

    /** 결재 대기 문서 수 변경 */
    public void updatePendingApprovals(int newCount) {
        this.pendingApprovals = newCount;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    private void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
