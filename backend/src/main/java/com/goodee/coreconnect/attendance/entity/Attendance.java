package com.goodee.coreconnect.attendance.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.dashboard.entity.Dashboard;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attendance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "att_id")
    private Integer attId;

    @Column(name = "att_check_in")
    private LocalDateTime checkIn;

    @Column(name = "att_check_out")
    private LocalDateTime checkOut;

    @Enumerated(EnumType.STRING)
    @Column(name = "att_status", length = 20)
    private AttendanceStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dash_id")
    private Dashboard dashboard;
}
