package com.goodee.coreconnect.dashboard.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.dashboard.dto.response.DashboardNoticeDTO;

public interface DashboardService {
	
	/** 대시보드용 공지사항 가져오기 */
	public List<DashboardNoticeDTO> getLatestNotices(Integer size);
	
	/** 공지사항 상세보기 */
	public DashboardNoticeDTO getDetailNotice(Integer id);
	
	/** 내가 합의자인 결재 대기 목록 조회 */
	Page<Document> findMyConsents(String email, Pageable pageable);
	
	/** 내가 참조자인 결재 대기 목록 조회 */
  Page<Document> findMyReferences(String email, Pageable pageable);
}
