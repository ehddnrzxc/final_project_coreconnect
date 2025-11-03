package com.goodee.coreconnect.board.entity;

import com.goodee.coreconnect.user.entity.User;
import jakarta.persistence.*;
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
        return history;
    }
}
