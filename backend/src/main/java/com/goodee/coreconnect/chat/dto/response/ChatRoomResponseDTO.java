package com.goodee.coreconnect.chat.dto.response;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Objects;

import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.user.entity.User;

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
public class ChatRoomResponseDTO {
	private Integer id;
	private String roomName;
	private String roomType;
	private Boolean favoriteStatus;
	
	/**
	 * key: userId
	 * value: UserSummaryDTO (userID, email, name)
	 * */
	private Map<Integer, UserSummaryResponseDTO> users;
	
	public static ChatRoomResponseDTO fromEntity(ChatRoom room) {
		if (room == null) return null;

		Map<Integer, UserSummaryResponseDTO> usersMap = new LinkedHashMap<>();
		if (room.getChatRoomUsers() != null) {
			usersMap = room.getChatRoomUsers().stream()
					.map(ChatRoomUser::getUser)
					.filter(Objects::nonNull)
					.collect(Collectors.toMap(
							User::getId,
							u -> UserSummaryResponseDTO.builder()
									.userId(u.getId())
									.userEmail(u.getEmail())
									.userName(u.getName())
									.build(),
							(a, b) -> a, // on key collision keep existing
							LinkedHashMap::new // preserve order
					));
		}

		return ChatRoomResponseDTO.builder()
				.id(room.getId())
				.roomName(room.getRoomName())
				.roomType(room.getRoomType())
				.favoriteStatus(room.getFavoriteStatus())
				.users(usersMap)
				.build();
	}
}
