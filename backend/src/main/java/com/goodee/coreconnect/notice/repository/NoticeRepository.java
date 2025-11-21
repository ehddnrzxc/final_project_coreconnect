package com.goodee.coreconnect.notice.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.notice.entity.Notice;
import com.goodee.coreconnect.notice.enums.NoticeCategory;

public interface NoticeRepository extends JpaRepository<Notice, Integer> {

    // 카테고리별 조회
    Page<Notice> findByCategoryOrderByCreatedAtDesc(NoticeCategory category, Pageable pageable);

    // 전체 조회 (최신순)
    Page<Notice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 카테고리별 목록 조회 (페이징 없이)
    List<Notice> findByCategoryOrderByCreatedAtDesc(NoticeCategory category);

    // 전체 목록 조회 (페이징 없이)
    List<Notice> findAllByOrderByCreatedAtDesc();
}

