package com.goodee.coreconnect.chat.dto.response;

import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.JobGrade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString
public class ChatUserResponseDTO {
	private Integer id;
	private String name;
	private String email;
	private JobGrade jobGrade; // 직급
	private String deptName; // 부서명
	private String profileImageUrl; // 프로필 이미지 URL (S3 URL)
	

    // ChatRoomUser → DTO
    public static ChatUserResponseDTO fromEntity(ChatRoomUser cru) {
        if (cru == null || cru.getUser() == null) return null;
        User user = cru.getUser();
        return fromEntity(user);
    }

    // User → DTO
    // ⚠️ 주의: profileImageUrl과 deptName은 Controller에서 명시적으로 설정해야 함 (Lazy Loading 문제)
    public static ChatUserResponseDTO fromEntity(User user) {
        if (user == null) return null;
        return ChatUserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .jobGrade(user.getJobGrade()) // 직급
                .deptName(null) // Controller에서 user.getDepartment().getDeptName()으로 명시적으로 설정 (Lazy Loading 방지)
                .profileImageUrl(null) // Controller에서 S3Service로 변환하여 설정
                .build();
    }
}
