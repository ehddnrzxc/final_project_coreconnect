package com.goodee.coreconnect.chat.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.JobGrade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString
@JsonInclude(JsonInclude.Include.ALWAYS) //  null 값도 JSON에 포함되도록 설정
public class ChatUserResponseDTO {
	private Integer id;
	private String name;
	private String email;
	private JobGrade jobGrade; // 직급
	private String deptName; // 부서명
	private String profileImageUrl; // 프로필 이미지 URL (S3 URL)
	

    // ChatRoomUser → DTO (S3Service 포함 버전 - 권장)
    // S3Service를 파라미터로 받아서 profileImageKey를 S3 URL로 변환하여 설정
    public static ChatUserResponseDTO fromEntity(ChatRoomUser cru, S3Service s3Service) {
        if (cru == null || cru.getUser() == null) return null;
        User user = cru.getUser();
        return fromEntity(user, s3Service);
    }

    // User → DTO (S3Service 포함 버전 - 권장)
    //  profileImageKey를 S3 전체 URL로 변환하여 profileImageUrl에 설정
    public static ChatUserResponseDTO fromEntity(User user, S3Service s3Service) {
        if (user == null) return null;
        
        // ⭐ 프로필 이미지 URL 변환 (user_profile_image_key → S3 URL)
        String profileImageUrl = "";
        String profileImageKey = user.getProfileImageKey();
        
        // ⚠️ 디버깅: profileImageKey 확인
        log.debug("[ChatUserResponseDTO.fromEntity] userId: {}, profileImageKey: {}", user.getId(), profileImageKey);
        
        if (profileImageKey != null && !profileImageKey.isBlank()) {
            try {
                profileImageUrl = s3Service.getFileUrl(profileImageKey);
                // ⚠️ 디버깅: 변환된 URL 확인
                log.debug("[ChatUserResponseDTO.fromEntity] profileImageUrl 생성 성공: {}", 
                         profileImageUrl != null ? profileImageUrl.substring(0, Math.min(50, profileImageUrl.length())) + "..." : "null");
            } catch (Exception e) {
                log.error("[ChatUserResponseDTO.fromEntity] S3 URL 변환 실패: {}", e.getMessage(), e);
                profileImageUrl = ""; // 예외 발생 시 빈 문자열
            }
        } else {
            log.debug("[ChatUserResponseDTO.fromEntity] profileImageKey가 null 또는 빈 문자열");
        }
        
        // ⭐ 부서명 설정
        String deptName = "";
        if (user.getDepartment() != null) {
            deptName = user.getDepartment().getDeptName();
        }
        
        ChatUserResponseDTO dto = ChatUserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .jobGrade(user.getJobGrade()) // 직급
                .deptName(deptName) // 부서명
                .profileImageUrl(profileImageUrl) // S3 URL로 변환된 프로필 이미지 URL
                .build();
        
        // ⚠️ 디버깅: 최종 DTO 확인
        log.debug("[ChatUserResponseDTO.fromEntity] 최종 DTO - id: {}, name: {}, profileImageUrl: {}", 
                 dto.getId(), dto.getName(), 
                 dto.getProfileImageUrl() != null ? dto.getProfileImageUrl().substring(0, Math.min(50, dto.getProfileImageUrl().length())) + "..." : "null");
        
        return dto;
    }

    // ChatRoomUser → DTO (S3Service 없이 - 하위 호환성용, Controller에서 추가 설정 필요)
    @Deprecated // ⚠️ S3Service를 포함한 버전 사용 권장
    public static ChatUserResponseDTO fromEntity(ChatRoomUser cru) {
        if (cru == null || cru.getUser() == null) return null;
        User user = cru.getUser();
        return fromEntity(user);
    }

    // User → DTO (S3Service 없이 - 하위 호환성용, Controller에서 추가 설정 필요)
    @Deprecated // ⚠️ S3Service를 포함한 버전 사용 권장
    public static ChatUserResponseDTO fromEntity(User user) {
        if (user == null) return null;
        return ChatUserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .jobGrade(user.getJobGrade()) // 직급
                .deptName("") // Controller에서 user.getDepartment().getDeptName()으로 명시적으로 설정 필요
                .profileImageUrl("") // Controller에서 S3Service로 변환하여 설정 필요
                .build();
    }
}
