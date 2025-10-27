package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board")
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
@Where(clause = "board_deleted_yn = false")
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id")
    private Integer id;

    @Column(name = "board_title", length = 50, nullable = false)
    private String title;

    @Column(name = "board_content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "board_notice_yn", nullable = false)
    private Boolean noticeYn = false;

    @Column(name = "board_private_yn", nullable = false)
    private Boolean privateYn = false;

    @Column(name = "board_view_count")
    private Integer viewCount = 0;

    @CreatedDate
    @Column(name = "board_created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "board_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_deleted_yn")
    private Boolean deletedYn = false;

    /**
     * N:1 관계 매핑 (user 테이블과 매핑)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * N:1 관계 매핑 (board_category 테이블과 매핑)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BoardCategory category;

    /**
     * 1:N 관계 매핑 (board_reply 테이블과 매핑)
     */
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<BoardReply> replies;

    /**
     * 1:N 관계 매핑 (board_file 테이블과 매핑)
     */
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BoardFile> files;
    
    protected Board() {};
    
    public static Board createBoard(User user, BoardCategory category, String title, String content, Boolean noticeYn, Boolean privateYn) {
      Board board = new Board();
      board.user = user;
      board.category = category;
      board.title = title;
      board.content = content;
      board.noticeYn = noticeYn != null ? noticeYn : false;
      board.privateYn = privateYn != null ? privateYn : false;
      board.createdAt = LocalDateTime.now();
      return board;
  }
    
}
