package com.goodee.coreconnect.dashboard.dto.response;



import java.time.LocalDateTime;

import com.goodee.coreconnect.board.entity.Board;

/** 대시보드 공지 요약 DTO */
public record DashboardNoticeDTO(
        Integer id,
        String title,
        String content,
        String writerName,
        LocalDateTime createdAt,
        Boolean pinned
) {
    public static DashboardNoticeDTO toDTO(Board board) {
        return new DashboardNoticeDTO(
                board.getId(),
                board.getTitle(),
                board.getContent(),
                board.getUser() != null ? board.getUser().getName() : null,
                board.getCreatedAt(),
                board.getPinned()
        );
    }
}
