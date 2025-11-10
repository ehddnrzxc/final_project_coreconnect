package com.goodee.coreconnect.email.dto.request;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmailSendRequestDTO {
	private Integer emailId;
	private String emailTitle;
	private String emailContent;
	private Integer senderId;
	private String senderAddress;          // 발신자 이메일
	private List<String> recipientAddress; // 발신자 ID
	private List<String> ccAddresses;      // 참조 CC
	private List<String> bccAddresses;      // 숨은참조 BCC
	private List<Integer> fileIds;         // 첨부파일 ID
	private String replyToEmailId;         // 답신 원본
	
    // 첨부파일(Attachment) 필드 추가! (예시: String형)
    private List<EmailAttachmentRequestDTO> attachments;
    // ★ emailType 필드 추가!
    private String emailType;               // 이메일 유형/코드 등
    
}
