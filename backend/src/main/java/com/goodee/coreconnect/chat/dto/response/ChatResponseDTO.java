package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.chat.entity.Chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ChatResponseDTO {
	private Integer id;
	private String messageContent;
	
	@JsonFormat(pattern = "yyyy-MM-dd H HH:mm:ss")
	private LocalDateTime sendAt;
	
	private Boolean fileYn;
	private String fileUrl;
	private Integer roomId;
	private Integer senderId;
	private String senderName;
	private String notificationType;
	
	 // Chat 엔티티를 ChatResponseDTO로 변환하는 static 메서드
    public static ChatResponseDTO fromEntity(Chat chat) {
        if (chat == null) return null;
        return ChatResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(chat.getFileUrl())
                .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
                .notificationType("CHAT")
                .build();
    }
	
	
}
