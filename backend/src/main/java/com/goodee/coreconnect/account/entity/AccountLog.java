package com.goodee.coreconnect.account.entity;

import java.time.LocalDateTime;

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

    @Column(name = "log_ip_address", length = 45) // IPv6 대비
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;


    /** 정적 팩토리 메서드 */
    public static AccountLog createAccountLog(User user, LogActionType actionType, String ipAddress) {
        AccountLog log = new AccountLog();
        log.user = user;
        log.actionType = actionType;
        log.ipAddress = ipAddress;
        log.actionTime = LocalDateTime.now(); // 자동 시간 기록
        return log;
    }


    /** 도메인 로직 */
    public void updateIp(String newIp) {
        this.ipAddress = newIp;
    }
}
