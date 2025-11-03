package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
@Table(name = "board")
public class Board {

    // ─────────────── 기본 속성 ───────────────
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
    
    @Column(name = "board_pinned_yn", nullable = false)
    private Boolean pinned = false; 

    @Column(name = "board_private_yn", nullable = false)
    private Boolean privateYn = false;

    @Column(name = "board_view_count", nullable = false)
    private Integer viewCount = 0;

    @CreatedDate
    @Column(name = "board_created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "board_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_deleted_yn", nullable = false)
    private Boolean deletedYn = false;


    // ─────────────── 연관관계 매핑 ───────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private BoardCategory category;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    @OrderBy("createdAt ASC")
    private List<BoardReply> replies = new ArrayList<>();

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<BoardFile> files = new ArrayList<>();
    
    
    /** Auditing 보완: 생성/수정 시각 수동 초기화 */
    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = null; // 등록 시 updatedAt 비움
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now(); // 수정 시에만 갱신
    }

    // ─────────────── 생성 메서드 ───────────────
    public static Board createBoard(User user, BoardCategory category, String title, String content, Boolean noticeYn, Boolean pinned, Boolean privateYn) {
        if (user == null) throw new IllegalArgumentException("작성자는 반드시 지정되어야 합니다.");
        if (category == null) throw new IllegalArgumentException("카테고리는 반드시 지정되어야 합니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("게시글 제목은 비어 있을 수 없습니다.");

        Board board = new Board();
        board.user = user;
        board.category = category;
        board.title = title;
        board.content = content;
        if (noticeYn != null) board.noticeYn = noticeYn;
        if (pinned != null) board.pinned = pinned;
        if (privateYn != null) board.privateYn = privateYn;
        return board;
    }


    // ─────────────── 도메인 행위 ───────────────
    /** 게시글 수정 */
    public void updateBoard(BoardCategory category, String title, String content, Boolean noticeYn, Boolean pinned, Boolean privateYn) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("게시글 제목은 비어 있을 수 없습니다.");
        
        this.category = (category != null) ? category : this.category;
        this.title = title;
        this.content = content;
        if (noticeYn != null) this.noticeYn = noticeYn;
        if (pinned != null) this.pinned = pinned;
        if (privateYn != null) this.privateYn = privateYn;
    }

    /** 조회수 증가 */
    public void increaseViewCount() {
        this.viewCount++;
    }

    /** Soft Delete */
    public void delete() {
        this.deletedYn = true;
    }
    
    /** pinned 상태 제어 */
    public void unpin() {
      this.pinned = false;
    }
}