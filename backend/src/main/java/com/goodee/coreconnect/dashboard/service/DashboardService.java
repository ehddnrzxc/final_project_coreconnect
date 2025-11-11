package com.goodee.coreconnect.dashboard.service;

import java.util.List;

import com.goodee.coreconnect.dashboard.dto.DashboardNoticeDTO;

public interface DashboardService {
	
	/** 대시보드용 공지사항 가져오기 */
	public List<DashboardNoticeDTO> getLatestNotices(Integer size);
	
	/** 공지사항 상세보기 */
	public DashboardNoticeDTO getDetailNotice(Integer id);
}
