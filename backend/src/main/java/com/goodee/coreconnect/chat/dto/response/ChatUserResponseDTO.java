package com.goodee.coreconnect.chat.dto.response;

import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
public class ChatUserResponseDTO {
	private Integer id;
	private String name;
	private String email;	
	
	public static ChatUserResponseDTO fromEntity(ChatRoomUser cru) {
        if (cru == null || cru.getUser() == null) return null;
        User user = cru.getUser();
        return new ChatUserResponseDTO(user.getId(), user.getName(), user.getEmail());
    }
}
