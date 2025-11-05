package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @Column(name = "board_created_at", updatable = false)
    private LocalDateTime createdAt;

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
        if (Boolean.TRUE.equals(pinned) && !Boolean.TRUE.equals(this.noticeYn)) {  // 공지글이 아닌데 pinned 요청이 들어오면 무시
            this.pinned = false;
        } else if (pinned != null) {
            this.pinned = pinned;
        }
        if (privateYn != null) this.privateYn = privateYn;
        
        this.updatedAt = LocalDateTime.now();
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