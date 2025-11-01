package com.goodee.coreconnect.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ChatUnreadCountDTO {
	 private Integer chatId;      // 메시지 ID
	 private Integer unreadCount; // 미읽은 인원 수
}
