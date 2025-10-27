package com.goodee.coreconnect.account.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

import com.goodee.coreconnect.user.entity.User;

@Entity
@Table(
    name = "account_log",
    indexes = {
        @Index(name = "idx_account_log_user_time", columnList = "user_id, log_action_time"),
        @Index(name = "idx_account_log_action", columnList = "log_action_type")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_action_type", length = 20, nullable = false)
    private LogActionType actionType;   // LOGIN, LOGOUT, FAIL 등

    @Column(name = "log_action_time", nullable = false)
    private LocalDateTime actionTime;

    @Column(name = "log_ip_address", length = 45) // IPv6 대비
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;
}
