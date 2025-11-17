package com.goodee.coreconnect.common.exception;

/**
 * 채팅방을 찾을 수 없을 때(잘못된 roomId 등) 발생시키는 예외
 */
public class ChatNotFoundException extends RuntimeException {

    public ChatNotFoundException() {
        super("채팅방을 찾을 수 없습니다.");
    }

    public ChatNotFoundException(String message) {
        super(message);
    }

    public ChatNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public ChatNotFoundException(Throwable cause) {
        super(cause);
    }
}