package com.goodee.coreconnect.dashboard.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.dashboard.dto.DashboardNoticeDTO;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardServiceImpl implements DashboardService {
	
	private final BoardRepository boardRepository;

	/** 대시보드 공지사항 리스트 */
	@Override
	public List<DashboardNoticeDTO> getLatestNotices(Integer size) {
		List<Board> boards =
                boardRepository.findByNoticeYnTrueAndDeletedYnFalseOrderByPinnedDescCreatedAtDesc();

        return boards.stream()
                .limit(size)
                .map(DashboardNoticeDTO::toDTO)
                .toList();
	}
	
	/** 대시보드 공지사항 상세 */
	@Override
	public DashboardNoticeDTO getDetailNotice(Integer id) {
		Board detail =  boardRepository.findById(id)
				              .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
		return DashboardNoticeDTO.toDTO(detail);
	}

}
