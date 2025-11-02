package com.goodee.coreconnect.chat.dto.response;

import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.user.entity.User;

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
	

    // ChatRoomUser → DTO
    public static ChatUserResponseDTO fromEntity(ChatRoomUser cru) {
        if (cru == null || cru.getUser() == null) return null;
        User user = cru.getUser();
        return fromEntity(user);
    }

    // User → DTO
    public static ChatUserResponseDTO fromEntity(User user) {
        if (user == null) return null;
        return ChatUserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
