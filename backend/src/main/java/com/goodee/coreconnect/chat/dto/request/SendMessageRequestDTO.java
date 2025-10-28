package com.goodee.coreconnect.chat.dto.request;

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
public class SendMessageRequestDTO {
	
	private Integer roomId;
	private Integer senderId;
	private String content;
	private Boolean fileYn;
	private String fileUrl;
	
	
	
	
	
}
