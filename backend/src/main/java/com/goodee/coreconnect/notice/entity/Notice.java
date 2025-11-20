package com.goodee.coreconnect.notice.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.notice.enums.NoticeCategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notice")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "notice_category", length = 20, nullable = false)
    private NoticeCategory category;

    @Column(name = "notice_title", length = 200, nullable = false)
    private String title;

    @Column(name = "notice_content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "notice_created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "notice_updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 정적 팩토리 메서드 (테스트/초기 데이터용)
    public static Notice createNotice(NoticeCategory category, String title, String content) {
        Notice notice = new Notice();
        notice.category = category;
        notice.title = title;
        notice.content = content;
        return notice;
    }
}

