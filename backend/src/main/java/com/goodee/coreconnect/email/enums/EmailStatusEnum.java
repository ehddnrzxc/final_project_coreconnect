package com.goodee.coreconnect.email.enums;

public enum EmailStatusEnum {
	SENT,        // 정상 발송됨
	BOUNCE,      // 반송됨
	FAILED,      // 발송 실패
	DELETED,    // 삭제처리됨
	DRAFT,      // 임시저장
	RESERVED    // 예약됨
}
