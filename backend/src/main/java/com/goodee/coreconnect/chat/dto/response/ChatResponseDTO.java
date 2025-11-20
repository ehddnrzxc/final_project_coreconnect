package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
    private String sendAt; // ★★★ 중요! LocalDateTime → String으로 변경
    private Boolean fileYn;
    private String fileUrl;
    private Integer roomId;
    private Integer senderId;
    private String senderName;
    private String senderEmail;
    private String senderProfileImageUrl;
    private com.goodee.coreconnect.user.enums.JobGrade senderJobGrade; // ⭐ 발신자 직급
    private String senderDeptName; // ⭐ 발신자 부서명
    private String notificationType;
    private Integer unreadCount;

    // 엔티티→DTO 변환
    public static ChatResponseDTO fromEntity(Chat chat) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"); // ISO format
        return ChatResponseDTO.builder()
            .id(chat.getId())
            .messageContent(chat.getMessageContent())
            .sendAt(chat.getSendAt() != null ? chat.getSendAt().format(formatter) : null) // ★★★
            .fileYn(chat.getFileYn())
            .fileUrl(chat.getFileUrl())
            .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
            .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
            .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
            .senderEmail(chat.getSender() != null ? chat.getSender().getEmail() : null)
            .senderProfileImageUrl(null) // Controller에서 S3Service로 변환하여 설정
            .unreadCount(chat.getUnreadCount() != null ? chat.getUnreadCount() : 0)
            .build();
    }

}
