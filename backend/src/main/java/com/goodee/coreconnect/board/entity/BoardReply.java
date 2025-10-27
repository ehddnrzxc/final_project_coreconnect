package com.goodee.coreconnect.board.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_reply")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_reply_id")
    private Integer id;

    @Column(name = "board_reply_content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "board_reply_created_at")
    private LocalDateTime createdAt;

    @Column(name = "board_reply_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_reply_deleted_yn")
    private Boolean deletedYn;

    @Column(name = "user_id")
    private Integer userId;

    // 부모 댓글 (대댓글 구조)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_reply_parent_id")
    private BoardReply parentReply;

    // 게시글 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
}
