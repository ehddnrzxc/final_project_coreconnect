package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_reply")
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
@Where(clause = "board_reply_deleted_yn = false")
public class BoardReply {

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

    /**
     * N:1 관계 매핑 (user 테이블과 매핑)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * N:1 자기참조 관계 매핑 (같은 board_reply 테이블 내에서 부모 댓글을 참조)
     * ex) 대댓글의 경우, parentReply는 상위 댓글을 가리킨다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_reply_parent_id")
    private BoardReply parentReply;

    /**
     * N:1 관계 매핑 (board 테이블과 매핑)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
    
    protected BoardReply() {};
    
    public static BoardReply createReply(User user, Board board, BoardReply parentReply, String content) {
      BoardReply reply = new BoardReply();
      reply.user = user;
      reply.board = board;
      reply.parentReply = parentReply;
      reply.content = content;
      reply.createdAt = LocalDateTime.now();
      return reply;
  }
    
}
