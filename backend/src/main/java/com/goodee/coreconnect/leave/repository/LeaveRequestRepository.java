package com.goodee.coreconnect.leave.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.entity.LeaveStatus;
import com.goodee.coreconnect.user.entity.User;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {
  
  // 로그인한 사용자의 휴가 신청 내역(최근 시작일 기준 정렬)
  List<LeaveRequest> findByUser_EmailOrderByCreatedAtDesc(String email);
  
  // 문서 ID 기준 조회
  Optional<LeaveRequest> findByDocumentId(Integer documentId);
  
  // 해당 연도에 해당하는 연차 조회(JPQL 사용)
  @Query("SELECT l from LeaveRequest l " + 
         "WHERE l.user = :user " + 
         "AND l.status = :status " + 
         "AND l.type = :type " + 
         "AND year(l.startDate) = :year")
  List<LeaveRequest> findByUserAndStatusAndTypeAndYear(
      @Param("user") User user,
      @Param("status") LeaveStatus status,
      @Param("type") String type,
      @Param("year") Integer year
  );
}
