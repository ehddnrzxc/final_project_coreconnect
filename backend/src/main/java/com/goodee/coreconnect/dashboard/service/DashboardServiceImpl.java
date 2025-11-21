package com.goodee.coreconnect.dashboard.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import com.goodee.coreconnect.approval.repository.ApprovalLineRepository;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.dashboard.dto.response.DashboardNoticeDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional 
public class DashboardServiceImpl implements DashboardService {
	
	private final BoardRepository boardRepository;
	private final ApprovalLineRepository approvalLineRepository;

	/** 대시보드 공지사항 리스트 */
	@Override
	@Transactional(readOnly = true)
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
	@Transactional(readOnly = true)
	public DashboardNoticeDTO getDetailNotice(Integer id) {
		Board detail =  boardRepository.findById(id)
				              .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
		return DashboardNoticeDTO.toDTO(detail);
	}

	/** 내가 합의자인 결재 대기 목록 조회 */
  @Override
  @Transactional(readOnly = true)
  public Page<Document> findMyConsents(String email, Pageable pageable) {
    return approvalLineRepository.findPageByApproverAndTypeAndStatus(
        email, 
        ApprovalLineType.AGREE, 
        ApprovalLineStatus.WAITING, 
        pageable);
  }

  /** 내가 참조자인 결재 대기 목록 조회 */
  @Override
  @Transactional(readOnly = true)
  public Page<Document> findMyReferences(String email, Pageable pageable) {
    return approvalLineRepository.findPageByApproverAndType(
        email,
        ApprovalLineType.REFER,              
        pageable
    );
  }
	
	

}
