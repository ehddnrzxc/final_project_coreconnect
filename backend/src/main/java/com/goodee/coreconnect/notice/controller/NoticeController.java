package com.goodee.coreconnect.notice.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.notice.dto.response.NoticeDetailResponseDTO;
import com.goodee.coreconnect.notice.dto.response.NoticeSummaryResponseDTO;
import com.goodee.coreconnect.notice.enums.NoticeCategory;
import com.goodee.coreconnect.notice.service.NoticeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notice")
@Slf4j
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 전체 공지사항 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<NoticeSummaryResponseDTO>> getAllNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NoticeSummaryResponseDTO> notices = noticeService.getAllNotices(pageable);
        return ResponseEntity.ok(notices);
    }

    /**
     * 카테고리별 공지사항 목록 조회
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Page<NoticeSummaryResponseDTO>> getNoticesByCategory(
            @PathVariable NoticeCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NoticeSummaryResponseDTO> notices = noticeService.getNoticesByCategory(category, pageable);
        return ResponseEntity.ok(notices);
    }

    /**
     * 공지사항 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<NoticeDetailResponseDTO> getNoticeDetail(@PathVariable Integer id) {
        NoticeDetailResponseDTO notice = noticeService.getNoticeDetail(id);
        return ResponseEntity.ok(notice);
    }

    /**
     * 카테고리별 공지사항 목록 조회 (페이징 없이, 전체 목록)
     */
    @GetMapping("/category/{category}/list")
    public ResponseEntity<List<NoticeSummaryResponseDTO>> getNoticesByCategoryList(
            @PathVariable NoticeCategory category) {
        List<NoticeSummaryResponseDTO> notices = noticeService.getNoticesByCategoryList(category);
        return ResponseEntity.ok(notices);
    }

    /**
     * 전체 공지사항 목록 조회 (페이징 없이)
     */
    @GetMapping("/list")
    public ResponseEntity<List<NoticeSummaryResponseDTO>> getAllNoticesList() {
        List<NoticeSummaryResponseDTO> notices = noticeService.getAllNoticesList();
        return ResponseEntity.ok(notices);
    }
}

