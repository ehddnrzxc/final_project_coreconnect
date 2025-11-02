package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.chat.entity.Chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@Builder
@ToString
public class ChatMessageSenderTypeResponseDTO {
	private Integer id;
    private String messageContent;
    private LocalDateTime sendAt;
    private Boolean fileYn;
    private String fileUrl;
    private Integer roomId;
    private Integer senderId;
    private String senderName;
    private boolean isMine;      // 내 메시지 여부
    private String senderType;   // "[내 메시지]" / "[다른 사람 메시지]"
    private Integer unreadCount; // 추가: 미읽은 인원 수
    
    /**
     * Chat 엔티티와 현재 사용자 ID를 받아서 DTO로 변환
     */
    public static ChatMessageSenderTypeResponseDTO fromEntity(Chat chat, Integer myUserId) {
        if (chat == null) return null;
        boolean isMine = chat.getSender() != null && chat.getSender().getId() != null && chat.getSender().getId().equals(myUserId);
        String senderType = isMine ? "[내 메시지]" : "[다른 사람 메시지]";
        return ChatMessageSenderTypeResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(chat.getFileUrl())
                .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
                .isMine(isMine)
                .senderType(senderType)
                .unreadCount(chat.getUnreadCount() != null ? chat.getUnreadCount() : 0)
                .build();
    }
}
