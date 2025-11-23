package com.goodee.coreconnect.account.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.account.enums.LogActionType;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) 
@Table(
    name = "account_log",
    indexes = {
        @Index(name = "idx_account_log_user_time", columnList = "user_id, log_action_time"),
        @Index(name = "idx_account_log_action", columnList = "log_action_type")
    }
)
public class AccountLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_action_type", length = 20, nullable = false)
    private LogActionType actionType;   // LOGIN, LOGOUT, REFRESH, FAIL

    @Column(name = "log_action_time", nullable = false)
    private LocalDateTime actionTime;

    @Column(name = "log_ipv4", length = 15) // IPv4 주소
    private String ipv4;

    @Column(name = "log_ipv6", length = 45) // IPv6 주소
    private String ipv6;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;


    /** 정적 팩토리 메서드 */
    public static AccountLog createAccountLog(User user, LogActionType actionType, String ipv4, String ipv6) {
        AccountLog log = new AccountLog();
        log.user = user;
        log.actionType = actionType;
        log.ipv4 = ipv4;
        log.ipv6 = ipv6;
        log.actionTime = LocalDateTime.now();
        return log;
    }
}
