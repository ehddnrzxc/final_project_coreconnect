package com.goodee.coreconnect.board.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "board")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id")
    private Integer id;

    @Column(name = "board_title", length = 50, nullable = false)
    private String title;

    @Column(name = "board_content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "board_notice_yn")
    private Boolean noticeYn;

    @Column(name = "board_private_yn")
    private Boolean privateYn;

    @Column(name = "board_view_count")
    private Integer viewCount;

    @Column(name = "board_created_at")
    private LocalDateTime createdAt;

    @Column(name = "board_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_deleted_yn")
    private Boolean deletedYn;

    // 작성자
    @Column(name = "user_id")
    private Integer userId;

    // 카테고리 연결 (ManyToOne)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BoardCategory category;

    // 댓글 목록 (OneToMany)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BoardReply> replies;

    // 첨부파일 목록 (OneToMany)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BoardFile> files;
}
