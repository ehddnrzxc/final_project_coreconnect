package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ChatRoomLatestMessageResponseDTO {
	private Integer roomId;
    private String roomName;
    private Integer lastMessageId;
    private String lastMessageContent;
    private String lastSenderName;
    private LocalDateTime lastMessageTime;
}
