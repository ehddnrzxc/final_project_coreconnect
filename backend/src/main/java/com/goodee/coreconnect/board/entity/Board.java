package com.goodee.coreconnect.board.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private Boolean noticeYn;

    @Column(name = "board_private_yn", nullable = false)
    private Boolean privateYn;

    @Column(name = "board_view_count")
    private Integer viewCount;

    @CreatedDate
    @Column(name = "board_created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "board_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "board_deleted_yn")
    private Boolean deletedYn;

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
}
