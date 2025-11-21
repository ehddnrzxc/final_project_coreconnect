package com.goodee.coreconnect.notice.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.notice.entity.Notice;
import com.goodee.coreconnect.notice.enums.NoticeCategory;

public record NoticeSummaryResponseDTO(
    Integer id,
    NoticeCategory category,
    String categoryLabel,
    String title,
    LocalDateTime createdAt
) {
    public static NoticeSummaryResponseDTO from(Notice notice) {
        return new NoticeSummaryResponseDTO(
            notice.getId(),
            notice.getCategory(),
            getCategoryLabel(notice.getCategory()),
            notice.getTitle(),
            notice.getCreatedAt()
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

