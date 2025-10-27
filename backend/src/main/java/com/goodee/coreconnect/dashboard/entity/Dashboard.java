package com.goodee.coreconnect.dashboard.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
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
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Dashboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dash_id")
    private Integer dashId;

    @Column(name = "dash_date", nullable = false)
    private LocalDate dashDate;               // 기준일(오늘자)

    @Column(name = "dash_work_time")
    private Integer workTime;                 // 근무시간(분)

    @Column(name = "dash_late_count")
    private Integer lateCount;                // 지각횟수

    @Column(name = "dash_absent_count")
    private Integer absentCount;              // 결근횟수

    @Column(name = "dash_unread_count")
    private Integer unreadCount;              // 안읽은 공지 수

    @Column(name = "dash_pending_approvals")
    private Integer pendingApprovals;         // 결재 대기 문서 수

    @Column(name = "dash_updated_at")
    private LocalDateTime updatedAt;          // 업데이트 시점

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist @PreUpdate
    private void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
