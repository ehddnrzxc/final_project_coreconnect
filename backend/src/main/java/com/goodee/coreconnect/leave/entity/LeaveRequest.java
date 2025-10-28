package com.goodee.coreconnect.leave.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // ✅ 외부에서 new 차단
@Table(
    name = "leave_request",
    indexes = {
        @Index(name = "idx_leave_req_user", columnList = "user_id"),
        @Index(name = "idx_leave_req_start", columnList = "leave_req_start_date"),
        @Index(name = "idx_leave_req_status", columnList = "leave_req_status")
    }
)
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leave_req_id")
    private Integer leaveReqId;

    @Column(name = "leave_req_start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "leave_req_end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "leave_req_type", length = 50, nullable = false)
    private String type; // 연차, 반차, 병가 등

    @Column(name = "leave_req_reason", length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_req_status", length = 20, nullable = false)
    private LeaveStatus status; // WAITING / APPROVED / REJECTED 등

    @Column(name = "leave_req_approved_date")
    private LocalDateTime approvedDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        foreignKey = @ForeignKey(name = "fk_leave_request_user")
    )
    private User user;

    // ───────────────────────────────
    // ✅ 정적 팩토리 메서드
    // ───────────────────────────────
    public static LeaveRequest createLeaveRequest(
            User user,
            LocalDate startDate,
            LocalDate endDate,
            String type,
            String reason
    ) {
        LeaveRequest leave = new LeaveRequest();
        leave.user = user;
        leave.startDate = startDate;
        leave.endDate = endDate;
        leave.type = type;
        leave.reason = reason;
        leave.status = LeaveStatus.PENDING; // 기본값: 대기 상태
        return leave;
    }

    // ───────────────────────────────
    // ✅ 도메인 행위
    // ───────────────────────────────

    /** 휴가 승인 */
    public void approve() {
        this.status = LeaveStatus.APPROVED;
        this.approvedDate = LocalDateTime.now();
    }

    /** 휴가 반려 */
    public void reject(String reason) {
        this.status = LeaveStatus.REJECTED;
        this.reason = reason;
        this.approvedDate = LocalDateTime.now();
    }

    /** 휴가 취소 */
    public void cancel() {
        this.status = LeaveStatus.CANCELED;
        this.approvedDate = LocalDateTime.now();
    }
}
