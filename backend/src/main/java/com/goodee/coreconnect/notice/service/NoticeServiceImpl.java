package com.goodee.coreconnect.notice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.notice.dto.response.NoticeDetailResponseDTO;
import com.goodee.coreconnect.notice.dto.response.NoticeSummaryResponseDTO;
import com.goodee.coreconnect.notice.entity.Notice;
import com.goodee.coreconnect.notice.enums.NoticeCategory;
import com.goodee.coreconnect.notice.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;

    @Override
    public Page<NoticeSummaryResponseDTO> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(NoticeSummaryResponseDTO::from);
    }

    @Override
    public Page<NoticeSummaryResponseDTO> getNoticesByCategory(NoticeCategory category, Pageable pageable) {
        return noticeRepository.findByCategoryOrderByCreatedAtDesc(category, pageable)
            .map(NoticeSummaryResponseDTO::from);
    }

    @Override
    public NoticeDetailResponseDTO getNoticeDetail(Integer id) {
        Notice notice = noticeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다: " + id));
        return NoticeDetailResponseDTO.from(notice);
    }

    @Override
    public List<NoticeSummaryResponseDTO> getNoticesByCategoryList(NoticeCategory category) {
        return noticeRepository.findByCategoryOrderByCreatedAtDesc(category)
            .stream()
            .map(NoticeSummaryResponseDTO::from)
            .collect(Collectors.toList());
    }

    @Override
    public List<NoticeSummaryResponseDTO> getAllNoticesList() {
        return noticeRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(NoticeSummaryResponseDTO::from)
            .collect(Collectors.toList());
    }
}

