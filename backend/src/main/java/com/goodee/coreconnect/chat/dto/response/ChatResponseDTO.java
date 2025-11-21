package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.common.service.S3Service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
    private List<String> fileUrls; // ⭐ 여러 파일 URL 목록
    private Integer roomId;
    private Integer senderId;
    private String senderName;
    private String senderEmail;
    private String senderProfileImageUrl;
    private com.goodee.coreconnect.user.enums.JobGrade senderJobGrade; // ⭐ 발신자 직급
    private String senderDeptName; // ⭐ 발신자 부서명
    private String notificationType;
    private Integer unreadCount;

    // 엔티티→DTO 변환 (S3Service 포함 버전 - 권장)
    public static ChatResponseDTO fromEntity(Chat chat, S3Service s3Service) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"); // ISO format
        
        // ⭐ 여러 파일 URL 목록 생성 (S3 키를 URL로 변환)
        List<String> fileUrls = new ArrayList<>();
        if (chat.getMessageFiles() != null && !chat.getMessageFiles().isEmpty()) {
            fileUrls = chat.getMessageFiles().stream()
                .map(file -> {
                    String s3Key = file.getS3ObjectKey();
                    if (s3Key != null && !s3Key.isEmpty() && s3Service != null) {
                        // ⚠️ 중요: 이미 URL 형식인지 확인 (옛날 데이터는 이미 URL로 저장되어 있을 수 있음)
                        if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
                            return s3Key; // 이미 URL이면 그대로 사용
                        } else {
                            return s3Service.getFileUrl(s3Key); // S3 키면 URL로 변환
                        }
                    }
                    return s3Key; // S3Service가 없으면 키 그대로 반환
                })
                .filter(url -> url != null && !url.isEmpty())
                .collect(Collectors.toList());
        }
        
        // ⭐ 첫 번째 파일 URL (하위 호환성) - S3 URL로 변환
        String fileUrl = chat.getFileUrl();
        if (fileUrl != null && !fileUrl.isEmpty() && s3Service != null) {
            // ⚠️ 중요: 이미 URL 형식인지 확인 (옛날 데이터는 이미 URL로 저장되어 있을 수 있음)
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                // 이미 URL 형식이면 그대로 사용
                fileUrl = fileUrl;
            } else {
                // S3 키 형식이면 URL로 변환
                try {
                    fileUrl = s3Service.getFileUrl(fileUrl);
                } catch (Exception e) {
                    // 변환 실패 시 원래 값 사용 (로그 출력)
                    log.warn("[ChatResponseDTO] S3 URL 변환 실패 - fileUrl: {}, error: {}", fileUrl, e.getMessage());
                }
            }
        }
        if (fileUrl == null && !fileUrls.isEmpty()) {
            fileUrl = fileUrls.get(0);
        }
        
        return ChatResponseDTO.builder()
            .id(chat.getId())
            .messageContent(chat.getMessageContent())
            .sendAt(chat.getSendAt() != null ? chat.getSendAt().format(formatter) : null) // ★★★
            .fileYn(chat.getFileYn())
            .fileUrl(fileUrl)
            .fileUrls(fileUrls) // ⭐ 여러 파일 URL 목록
            .roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
            .senderId(chat.getSender() != null ? chat.getSender().getId() : null)
            .senderName(chat.getSender() != null ? chat.getSender().getName() : null)
            .senderEmail(chat.getSender() != null ? chat.getSender().getEmail() : null)
            .senderProfileImageUrl(null) // Controller에서 S3Service로 변환하여 설정
            .unreadCount(chat.getUnreadCount() != null ? chat.getUnreadCount() : 0)
            .build();
    }
    
    // 엔티티→DTO 변환 (하위 호환성용 - S3Service 없이)
    @Deprecated // ⚠️ S3Service를 포함한 버전 사용 권장
    public static ChatResponseDTO fromEntity(Chat chat) {
        return fromEntity(chat, null);
    }

}
