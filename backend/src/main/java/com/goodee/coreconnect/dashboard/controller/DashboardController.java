package com.goodee.coreconnect.dashboard.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.dashboard.dto.DashboardNoticeDTO;
import com.goodee.coreconnect.dashboard.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
	
	private final DashboardService dashboardService;
	
	/** 대시보드 최근 공지 */
	@GetMapping("/notices/latest")
    public List<DashboardNoticeDTO> getLatestNotices(
            @RequestParam(name = "size", defaultValue = "5") Integer size
    ) {
        return dashboardService.getLatestNotices(size);
    }
	
	/** 대시보드 공지 상세 */
	@GetMapping("/notices/detail/{id}")
	public DashboardNoticeDTO getDetailNotice(@PathVariable("id") Integer id) {
		return dashboardService.getDetailNotice(id);
	}

}
