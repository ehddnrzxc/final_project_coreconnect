package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//채팅방 목록에서: 방 id, 이름, 마지막 메시지 내용/시간, 마지막 보낸사람, 안읽은 메시지수 표시
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomListDTO {
	private Integer roomId;
	private String roomName;
	private String lastMessageContent;
	private LocalDateTime lasMessageTime;
	private String lastSenderName;
	private long unreadCount;
	private Boolean lastMessageFileYn; // 마지막 메시지의 파일 첨부 여부
	
}
