package com.goodee.coreconnect.notice.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.notice.entity.Notice;
import com.goodee.coreconnect.notice.enums.NoticeCategory;

public record NoticeDetailResponseDTO(
    Integer id,
    NoticeCategory category,
    String categoryLabel,
    String title,
    String content,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static NoticeDetailResponseDTO from(Notice notice) {
        return new NoticeDetailResponseDTO(
            notice.getId(),
            notice.getCategory(),
            getCategoryLabel(notice.getCategory()),
            notice.getTitle(),
            notice.getContent(),
            notice.getCreatedAt(),
            notice.getUpdatedAt()
        );
    }

    private static String getCategoryLabel(NoticeCategory category) {
        return switch (category) {
            case SYSTEM_NOTICE -> "시스템 안내";
            case SERVICE_INFO -> "서비스 정보";
            case UPDATE -> "업데이트";
        };
    }
}

