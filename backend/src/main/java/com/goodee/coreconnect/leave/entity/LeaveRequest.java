package com.goodee.coreconnect.leave.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "leave_request",
    indexes = {
        @Index(name = "idx_leave_req_user", columnList = "user_id"),
        @Index(name = "idx_leave_req_start", columnList = "leave_req_start_date"),
        @Index(name = "idx_leave_req_status", columnList = "leave_req_status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private LeaveStatus status; // Enum 매핑

    @Column(name = "leave_req_approved_date")
    private LocalDateTime approvedDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        foreignKey = @ForeignKey(name = "fk_leave_request_user")
    )
    private User user;
}
