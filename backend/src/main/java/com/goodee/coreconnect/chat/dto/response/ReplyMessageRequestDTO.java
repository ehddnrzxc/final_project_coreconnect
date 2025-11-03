package com.goodee.coreconnect.chat.dto.response;

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
public class ReplyMessageRequestDTO {
	 // 답신할 메시지의 ID (선택적으로 사용, 필요 없으면 제거 가능)
    private Integer originalMessageId;

    // 답신 내용
    private String replyContent;
}
