package com.goodee.coreconnect.email.dto.request;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class EmailAttachmentRequestDTO {
	private String fileName;
	private String baSE64cONTENT; // 실제 파일 내용
	private String mimeType;
	private long fileSize;
}
