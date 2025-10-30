package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "board_reply")
public class BoardReply {

    // ─────────────── 기본 속성 ───────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_reply_id")
    private Integer id;

    @Column(name = "board_reply_content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @CreatedDate
    @Column(name = "board_reply_created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "board_reply_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_reply_deleted_yn", nullable = false)
    private Boolean deletedYn = false;


    // ─────────────── 연관관계 매핑 ───────────────
    /** 작성자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 부모 댓글 (자기참조 관계) — 대댓글 1단계까지만 허용 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_reply_parent_id")
    private BoardReply parentReply;

    /** 게시글 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;


    // ─────────────── 생성 메서드 ───────────────
    public static BoardReply createReply(User user, Board board, BoardReply parentReply, String content) {
        if (user == null) throw new IllegalArgumentException("댓글 작성자는 반드시 지정되어야 합니다.");
        if (board == null) throw new IllegalArgumentException("댓글이 속한 게시글은 반드시 지정되어야 합니다.");
        if (content == null || content.isBlank()) throw new IllegalArgumentException("댓글 내용은 비어 있을 수 없습니다.");

        BoardReply reply = new BoardReply();
        reply.user = user;
        reply.board = board;
        reply.parentReply = parentReply; // null이면 일반 댓글, 있으면 1단계 대댓글
        reply.content = content;
        reply.createdAt = LocalDateTime.now();
        return reply;
    }

    // ─────────────── 도메인 행위 ───────────────
    /** 댓글 수정 */
    public void updateReply(String content) {
        if (content == null || content.isBlank()) throw new IllegalArgumentException("댓글 내용은 비어 있을 수 없습니다.");
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }

    /** Soft Delete */
    public void delete() {
        this.deletedYn = true;
    }
}
