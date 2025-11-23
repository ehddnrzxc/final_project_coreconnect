package com.goodee.coreconnect.leave.enums;

import lombok.Getter;

@Getter
public enum LeaveType {
  ANNUAL("연차"), // 연차
  HALF_DAY_MORNING("반차(오전)"), // 반차(오전)
  HALF_DAY_AFTERNOON("반차(오후)"), // 반차(오후)
  SICK("병가"), // 병가
  FAMILY_EVENT("경조휴가"), // 경조휴가
  ETC("기타"); // 기타
  
  private final String description;
  
  private LeaveType(String description) {
    this.description = description;
  }
  
  public static String getKoreanByCode(String code) {
    if (code == null || code.isEmpty()) return "";
    try {
      return LeaveType.valueOf(code).getDescription();
    } catch (Exception e) {
      return code;
    }
  }
  
}

