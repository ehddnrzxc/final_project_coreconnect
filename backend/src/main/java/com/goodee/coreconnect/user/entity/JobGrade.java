package com.goodee.coreconnect.user.entity;

public enum JobGrade {
    INTERN("인턴"),
    STAFF("사원"),
    ASSISTANT_MANAGER("대리"),
    MANAGER("과장"),
    DEPUTY_GENERAL_MANAGER("차장"),
    GENERAL_MANAGER("부장"),
    DIRECTOR("이사"),
    EXECUTIVE_DIRECTOR("상무"),
    VICE_PRESIDENT("전무"),
    PRESIDENT("대표");

    private final String label;
    JobGrade(String label) { this.label = label; }
    public String label() { return label; }
}
