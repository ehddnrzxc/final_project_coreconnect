package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatRoomSummaryResponseDTO {
	private Integer roomId;
    private String roomName;
    private Integer unreadCount;
    private Integer lastMessageId;
    private String lastMessageContent;
    private String lastSenderName;
    private LocalDateTime lastMessageTime;
}
