package com.goodee.coreconnect.notice.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.goodee.coreconnect.notice.dto.response.NoticeDetailResponseDTO;
import com.goodee.coreconnect.notice.dto.response.NoticeSummaryResponseDTO;
import com.goodee.coreconnect.notice.enums.NoticeCategory;

public interface NoticeService {
    /**
     * 전체 공지사항 목록 조회 (최신순)
     */
    Page<NoticeSummaryResponseDTO> getAllNotices(Pageable pageable);

    /**
     * 카테고리별 공지사항 목록 조회
     */
    Page<NoticeSummaryResponseDTO> getNoticesByCategory(NoticeCategory category, Pageable pageable);

    /**
     * 공지사항 상세 조회
     */
    NoticeDetailResponseDTO getNoticeDetail(Integer id);

    /**
     * 카테고리별 공지사항 목록 조회 (페이징 없이)
     */
    List<NoticeSummaryResponseDTO> getNoticesByCategoryList(NoticeCategory category);

    /**
     * 전체 공지사항 목록 조회 (페이징 없이)
     */
    List<NoticeSummaryResponseDTO> getAllNoticesList();
}

