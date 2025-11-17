package com.goodee.coreconnect.dashboard.controller;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;
import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import com.goodee.coreconnect.dashboard.dto.DashboardNoticeDTO;
import com.goodee.coreconnect.dashboard.dto.MyInboxResponseDTO;
import com.goodee.coreconnect.dashboard.service.DashboardService;
import com.goodee.coreconnect.department.service.DepartmentService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
import com.goodee.coreconnect.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
	
	private final DashboardService dashboardService;
	private final UserService userService;
	private final DepartmentService departmentService;
	
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
	
	/** 로그인된 사용자의 부서 ID로 해당 부서의 게시판 카테고리 ID를 조회 */
	@GetMapping("/my-department")
  public ResponseEntity<Integer> getMyDeptCategoryId(@AuthenticationPrincipal CustomUserDetails user) {
      Integer deptId = userService.getDeptIdByEmail(user.getEmail());
      Integer categoryId = departmentService.getBoardCategoryIdByDeptId(deptId);
      return ResponseEntity.ok(categoryId);
  }
	
	/** 합의/참조 대기중 결재 목록 조회 */
	@Operation(summary = "수신함(합의+참조) 조회", description = "내가 합의할 문서 / 내가 참조로 받은 문서를 한 번에 조회합니다.")
	@GetMapping("/my-inbox")
	public ResponseEntity<MyInboxResponseDTO> getMyInbox(
	    @AuthenticationPrincipal CustomUserDetails user,
	    // 합의(내 액션)용 필터
	    @RequestParam(name = "consentStatus", defaultValue = "PENDING") String consentStatus,
	    // 참조(열람)용 필터
	    @RequestParam(name = "unreadOnly", defaultValue = "true") boolean unreadOnly,
	    // 각 섹션 페이징 (독립적으로 컨트롤)
	    @RequestParam(name = "consentsPage", defaultValue = "0") int consentsPage,
	    @RequestParam(name = "consentsSize", defaultValue = "5") int consentsSize,
	    @RequestParam(name = "referencesPage", defaultValue = "0") int referencesPage,
	    @RequestParam(name = "referencesSize", defaultValue = "5") int referencesSize
	) {
	    String email = user.getEmail();

	    Pageable consentsPageable   = PageRequest.of(consentsPage, consentsSize);
	    Pageable referencesPageable = PageRequest.of(referencesPage, referencesSize);

	    // 서비스에서 리스트 + 총합을 각각 가져옴
	    Page<Document> consentsPageResult   = dashboardService.findMyConsents(email, consentsPageable);
	    Page<Document> referencesPageResult = dashboardService.findMyReferences(email, referencesPageable);

	    MyInboxResponseDTO body = MyInboxResponseDTO.builder()
	        .consents(consentsPageResult.getContent().stream()
	                  .map(DocumentSimpleResponseDTO::toDTO)
	                  .collect(Collectors.toList()))
	        .consentsTotal(consentsPageResult.getTotalElements())
	        .references(referencesPageResult.getContent().stream()
	                  .map(DocumentSimpleResponseDTO::toDTO)
	                  .collect(Collectors.toList()))
	        .referencesTotal(referencesPageResult.getTotalElements())
	        .build();

	    return ResponseEntity.ok(body);
	}

	/**
	 * 결재선을 문자열로 변환합니다.
	 * @param lines 결재선 목록
	 * @return "결재자1(상태) -> 결재자2(상태)" 형태의 문자열
	 */
	private String generateApprovalLine(List<ApprovalLine> lines) {
	    if (lines == null || lines.isEmpty()) {
	        return "-";
	    }
	    
	    String displayString = lines.stream()
	        .filter(line -> line.getApprovalLineType() != ApprovalLineType.REFER)
	        .sorted(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
	        .map(line -> {
	            String approverName = (line.getApprover() != null) ? line.getApprover().getName() : "정보없음";
	            String status = line.getApprovalLineStatus().name();
	            return String.format("%s(%s)", approverName, status);
	        })
	        .collect(Collectors.joining(" -> "));
	    return displayString.isEmpty() ? "-" : displayString;
	}

}
