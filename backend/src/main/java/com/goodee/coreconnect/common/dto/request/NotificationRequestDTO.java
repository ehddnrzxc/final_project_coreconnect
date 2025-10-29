package com.goodee.coreconnect.common.dto.request;

import java.util.List;
import java.util.Map;

import com.goodee.coreconnect.common.notification.enums.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class NotificationRequestDTO {

	// CHAT, EMAIL, NOTICE, APPROVAL, SCHEDULE
	private NotificationType type;
	
	// 알림 발신자
	private Integer senderId;
	
	// 알림 수신자 (여러명 가능)
	private List<Integer> receiverIds;
	
	// 알림 표시 메시지 (자동생성 or 직접 입력)
	private String message;
	
	// 채팅방에서 필요시 사용
	private Integer roomId;
	
	// 타입별 추가 정보 (문서ID, 일정정보 등)
	private Map<String, Object> extraData;
	
	
	
	
	
	
	
	
	
}
