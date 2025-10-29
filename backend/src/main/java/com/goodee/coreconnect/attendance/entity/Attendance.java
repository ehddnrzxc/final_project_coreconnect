package com.goodee.coreconnect.attendance.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.dashboard.entity.Dashboard;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) 
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "att_id")
    private Integer attId;

    @Column(name = "att_check_in", nullable = false)
    private LocalDateTime checkIn;

    @Column(name = "att_check_out")
    private LocalDateTime checkOut;

    @Enumerated(EnumType.STRING)
    @Column(name = "att_status", length = 20, nullable = false)
    private AttendanceStatus status; // PRESENT, LATE, ABSENT, LEAVE_EARLY

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dash_id")
    private Dashboard dashboard;


    // 정적 팩토리 메서드

    public static Attendance createAttendance(User user, AttendanceStatus status, Dashboard dashboard) {
        Attendance attendance = new Attendance();
        attendance.user = user;
        attendance.status = status;
        attendance.dashboard = dashboard;
        attendance.checkIn = LocalDateTime.now(); // 출근 시점 자동 기록
        return attendance;
    }


    // 도메인 행위 (업무 로직)
 

    /** 퇴근 처리 */
    public void checkOut() {
        this.checkOut = LocalDateTime.now();
        this.status = AttendanceStatus.LEAVE_EARLY;
    }

    /** 상태 강제 변경 (예: 결근, 조퇴 등) */
    public void updateStatus(AttendanceStatus newStatus) {
        this.status = newStatus;
    }
}
