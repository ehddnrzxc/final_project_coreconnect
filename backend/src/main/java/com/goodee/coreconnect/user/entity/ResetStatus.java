package com.goodee.coreconnect.user.entity;


/** 비밀번호 변경 요청 상태를 나타내는 ENUM */
public enum ResetStatus {
  
  PENDING, // 승인 대기
  APPROVED, // 승인 완료
  REJECTED // 승인 거부

}
