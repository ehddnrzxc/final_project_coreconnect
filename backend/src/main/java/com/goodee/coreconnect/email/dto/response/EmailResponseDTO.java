package com.goodee.coreconnect.email.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailResponseDTO {
	private Integer emailId;                  // 메일 기본키
    private String emailTitle;                // 제목
    private String emailContent;              // 본문
    private Integer senderId;                 // 발신자 ID
    private LocalDateTime sentTime;           // 발송 시각
    private String emailStatus;               // 메일 상태 (SENT/FAILED/BOUNCE 등)
    private String senderName;                // ★ 발신자명 추가!
    private List<String> recipientAddresses;  // To 수신자 리스트
    private List<String> ccAddresses;         // CC 목록
    private List<String> bccAddresses;        // BCC 목록
    private List<Integer> fileIds;            // 첨부 파일 ID 목록
    private String replyToEmailId;            // 답장 대상 메일 ID
    private String emailbounceReason;         // 반송 사유
		
}
