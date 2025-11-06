package com.goodee.coreconnect.email.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class EmailResponseDTO {
	private Integer emailId;
	private String emailTitle;
	private String emailContent;
	private String senderName;
	private LocalDateTime sentTime;
	private List<String> recipientAddresses;
	private List<String> ccAddresses;
	private List<String> bcAddresses;
	private List<String> fileUrl;
	private Boolean isRead;
	private String emailStatus;
	private String bounceReason;
	
}
