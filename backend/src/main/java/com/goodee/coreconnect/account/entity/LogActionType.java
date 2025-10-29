package com.goodee.coreconnect.account.entity;

/**
 * 사용자 인증 및 토큰 관련 주요 동작을 구분하기 위한 ENUM.
 * 로그인 이력에서 사용.
 */
public enum LogActionType {

  LOGIN,   // 로그인 성공 (정상 인증 시)
  LOGOUT,  // 로그아웃 수행 (세션/토큰 종료)
  FAIL,    // 로그인 실패 (비밀번호 오류, 비활성 계정 등)
  REFRESH  // 토큰 재발급 성공 (Refresh Token 사용)
}


