package com.goodee.coreconnect.chat.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

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
	
	@JsonFormat(pattern = "yyyy-MM-dd H HH:mm:ss")
	private LocalDateTime sendAt;
	
	private Boolean fileYn;
	private String fileUrl;
	private Integer roomId;
	private Integer senderId;
	private String senderName;
	private String notificationType;
	
	
	
	
}
