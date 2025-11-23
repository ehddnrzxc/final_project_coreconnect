package com.goodee.coreconnect.common.dto.response;

import java.util.List;

import com.goodee.coreconnect.chat.dto.response.ChatUserResponseDTO;

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
public class ResponseDTO<T> {

	private int status;
	private String message;
	private T data;
	
	

    public static <T> ResponseDTO<T> success(T data, String message) {
        return ResponseDTO.<T>builder()
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ResponseDTO<T> badRequest(String message) {
        return ResponseDTO.<T>builder()
                .status(400)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ResponseDTO<T> internalError(String message) {
        return ResponseDTO.<T>builder()
                .status(500)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ResponseDTO<T> unauthorized() {
        return ResponseDTO.<T>builder()
                .status(401)
                .message("로그인이 필요합니다.")
                .data(null)
                .build();
    }

    /**
     * 범용 에러 응답 생성
     * @param message 에러 메시지
     * @return ResponseDTO with status 500
     */
    public static <T> ResponseDTO<T> error(String message) {
        return ResponseDTO.<T>builder()
                .status(500)
                .message(message)
                .data(null)
                .build();
    }

    /**
     * 범용 에러 응답 생성 (HTTP 상태 코드 지정)
     * @param <T> 제네릭 타입
     * @param status HTTP 상태 코드
     * @param message 에러 메시지
     * @return ResponseDTO with specified status
     */
    public static <T> ResponseDTO<T> error(int status, String message) {
        return ResponseDTO.<T>builder()
                .status(status)
                .message(message)
                .data(null)
                .build();
    }
}	
