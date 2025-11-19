package com.goodee.coreconnect.leave.enums;

/**
 * 휴가 유형을 나타내는 Enum
 */
public enum LeaveType {
  
  ANNUAL("연차"),
  HALF_DAY_MORNING("반차(오전)"),
  HALF_DAY_AFTERNOON("반차(오후)"),
  SICK("병가"),
  FAMILY_EVENT("경조휴가"),
  ETC("기타");
  
  private final String label;
  
  LeaveType(String label) {
    this.label = label;
  }
  
  public String getLabel() {
    return label;
  }
  
  /**
   * label로 LeaveType을 찾는 메서드
   */
  public static LeaveType fromLabel(String label) {
    for (LeaveType type : values()) {
      if (type.label.equals(label)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unknown leave type: " + label);
  }
}

