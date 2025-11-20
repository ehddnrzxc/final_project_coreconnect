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
	private String senderEmail;
	private String senderProfileImageUrl;
	private com.goodee.coreconnect.user.enums.JobGrade senderJobGrade; // ⭐ 발신자 직급
	private String senderDeptName; // ⭐ 발신자 부서명
	private Integer unreadCount;
	private String roomName;
	private Boolean readYn;
	
	// ✨ 2. readYn 파라미터를 받도록 메서드 시그니처 변경
    public static ChatMessageResponseDTO fromEntity(Chat chat, Boolean readYn) {
        if (chat == null) return null;

        String fileUrl = null;
        if (chat.getMessageFiles() != null && !chat.getMessageFiles().isEmpty()) {
        	fileUrl = chat.getMessageFiles().get(0).getS3ObjectKey();
        } else {
        	fileUrl = chat.getFileUrl();
        }
        
        return ChatMessageResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(fileUrl)
                .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .roomName(chat.getChatRoom() != null ? chat.getChatRoom().getRoomName() : null)
                .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
                .senderEmail(chat.getSender() != null ? chat.getSender().getEmail() : null)
                .senderProfileImageUrl(null) // Controller에서 S3Service로 변환하여 설정
                .unreadCount(chat.getUnreadCount() != null ? chat.getUnreadCount() : 0)
                .readYn(readYn) // ✨ 3. DTO에 포함!
                .build();
    }
}