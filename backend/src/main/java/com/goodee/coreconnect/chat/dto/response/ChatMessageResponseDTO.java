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
	private Integer unreadCount; // 추가: 미읽은 인원 수
	private String roomName;
	
	 // 추가: Chat 객체를 DTO로 변환하는 메서드
    public static ChatMessageResponseDTO fromEntity(Chat chat) {
        if (chat == null) return null;
        
        String fileUrl = null;
        if (chat.getMessageFiles() != null && !chat.getMessageFiles().isEmpty()) {
        	// 여러 개일 경우 첫 번째 파일 기준, 필요시 for문/리스트로 확장
        	fileUrl = chat.getMessageFiles().get(0).getS3ObjectKey();
        } else {
        	fileUrl = chat.getFileUrl();
        }
        
        return ChatMessageResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(chat.getMessageFiles() != null && !chat.getMessageFiles().isEmpty()
                		? chat.getMessageFiles().get(0).getS3ObjectKey()
                	    : chat.getFileUrl())
                .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .roomName(chat.getChatRoom() != null ? chat.getChatRoom().getRoomName() : null)
                .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
                .unreadCount(chat.getUnreadCount() != null ? chat.getUnreadCount() : 0) // null-safe
                .build();
    }
}
