package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "board_view_history", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "board_id"})
})
public class BoardViewHistory {

    //─────────────── 기본 속성 ───────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_view_history_id")
    private Integer id;
    
    @Column(name = "viewed_at", nullable = false, columnDefinition = "DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)")
    private LocalDateTime viewedAt;

    
    // ─────────────── 연관관계 매핑 ───────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    
    // ─────────────── 생성 메서드 ───────────────
    public static BoardViewHistory create(User user, Board board) {
        BoardViewHistory history = new BoardViewHistory();
        history.user = user;
        history.board = board;
        history.viewedAt = LocalDateTime.now();
        return history;
    }
    
    // 이미 존재하는 조회 기록의 시간만 갱신할 때 사용
    public void updateViewedAt() {
        this.viewedAt = LocalDateTime.now();
    }
}
