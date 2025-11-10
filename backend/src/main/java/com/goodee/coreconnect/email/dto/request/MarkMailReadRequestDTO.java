package com.goodee.coreconnect.email.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter 
@Schema(description = "메일 읽음 처리 요청 DTO")
public class MarkMailReadRequestDTO {

    @Schema(description = "읽음 처리할 사용자 이메일", example = "user@example.com")
    private String userEmail;
}
