package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.chat.entity.Chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@ToString
public class ChatMessageResponseDTO {
	
	private Integer id;
	private String messageContent;
	private LocalDateTime sendAt;
	private Boolean fileYn;
	private String fileUrl;
	private Integer roomId;
	private Integer senderId;
	private String senderName;
	
	 // 추가: Chat 객체를 DTO로 변환하는 메서드
    public static ChatMessageResponseDTO fromEntity(Chat chat) {
        if (chat == null) return null;
        return ChatMessageResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(chat.getFileUrl())
                .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
                .build();
    }
}
