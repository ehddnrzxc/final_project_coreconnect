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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "board_reply")
public class BoardReply {

    // ─────────────── 기본 속성 ───────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_reply_id")
    private Integer id;

    @Column(name = "board_reply_content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "board_reply_created_at", updatable = false)
    private LocalDateTime createdAt;

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
    
    
    /** 
     * 엔티티 최초 저장 시각 초기화
     * - createdAt: 현재 시각으로 설정
     * - updatedAt: 등록 시에는 null 유지
     */
    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = null; 
    }


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
