package com.goodee.coreconnect.chat.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class CreateRoomRequestDTO {
	private String roomName;
	private Boolean roomType;
	private List<Integer> userIds;
}
