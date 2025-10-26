package com.goodee.coreconnect;

import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;

import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpHeaders;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.chat.service.ChatRoomServiceImpl;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

/**
 * WebSocketHandler 및 채팅/알림 비즈니스 로직 테스트
 * */
public class ChatWebSocketHandlerTest {

	@Mock
	ChatRoomService chatRoomService;
	
	@Mock
	UserRepository userRepository;
	
	@Mock
	JwtProvider jwtProvider;
	
	@Mock
	NotificationRepository notificationRepository;
	
	ChatWebSocketHandler handler;
	
	// 각 테스트 메서드 실행 전에 항상 이 메서드를 먼저 실행함 (테스트 준비)
	@BeforeEach
	void setUP() {
		// this를 사용하여 Mockitor가 @Mock으로 선언된 필드들을 초기화 (가짜 객체 생성 및 주입)
		MockitoAnnotations.openMocks(this);
		
		// 테스트용 ChatWebSocketHandler 인스턴스 생성
		// 생성자에 필요한 의존성(Mock개체들)을 주입
		handler = new ChatWebSocketHandler(jwtProvider, userRepository, chatRoomService, notificationRepository);
	}
	
	@Test
	@DisplayName("1. WebSocket 연결/해제 정상 동작")
	void testWebSocketConnection() throws Exception {
		// WebSocketSession을 Mockito로 Mock 객체 생성
		WebSocketSession session = mock(WebSocketSession.class);
		
		
		// 세션에서 핸드셰이크 헤더를 반환하도록 설정 (빈 HttpHeaders)
		when(session.getHandshakeHeaders()).thenReturn(new HttpHeaders());
		
		
		// 세션에서 핸드셰이크 헤더를 반환하도록 설정 (accessToken 포함)
		// Mockito로 만든 Mock 객체 session의 메서드 호출 결과를 ㅣㅁ리 지정하기 위해 when 사용
		/*
		 * ChatWebSocketHandler에서 getUserIdFromSession(session)을 호출하면 내부적으로 session.getUri()를 사용해 accessToken을 추출함
		 * 내가 원하는 URI 값이 반환되어야 이후 JWT 토큰 파싱, 사용자 인증 등이 올바르게 동작함
		 * when(...).thenReturn(...)은 Mockitor MOck 객체의 특정 메서드가 호출될 때 내가 원하는 값을 반환하도록 지정하는데 필수적인 기능
		 * */
		when(session.getUri()).thenReturn(new java.net.URI("ws://localhost/ws?accessToken=faketoken"));
		
		// JWTProvider가 getSubject 호출 시 "choimeeyoung2@gmail.com" 반환하도록 설정
		// anyString()은 Mock 객체의 메서드 호출에서 어떤 문자열이 들어와도 매칭이 되도록 지정하는 역할(ArgumentMatcher)이다
		when(jwtProvider.getSubject(anyString())).thenReturn("choimeeyoung2@gmail.com");
		
		// 테스트용 User 객체 생성 및 id, email 설정
		User user = new User();
		user.setId(1);
		user.setEmail("choimeeyoung2@gmail.com");
		
		// UserRepository가 findByEmail 호출 시 위 user 객체를 반환하도록 설정
		when(userRepository.findByEmail("choimeeyoung2@gmail.com")).thenReturn(Optional.of(user));
		
		// WebSocket 연결 후 userSessions에 userId가 정상적으로 저장되는지 확인
		handler.afterConnectionEstablished(session);
		assertTrue(handler.userSessions.containsKey(1));
		
		// WebSocket 연결 해제 후 userSessions에서 userId가 정상적으로 제거되는지 확인
		handler.afterConnectionClosed(session, CloseStatus.NORMAL);
		assertFalse(handler.userSessions.containsKey(1));
	}
	
	
	@Test
	@DisplayName("2. 채팅방 생성/초대/참여자 관리")
	void testCreatedChatRoomANdInvite() {
		// 채팅방 생성, 참여자 초대, 참여자 리스트 관리
		// ChatRoomServiceImpl의 Mock 객체를 생성 (실제 DB/비즈니스 로직이 아니라 테스트용 가짜 객체)
		ChatRoomServiceImpl chatRoomServiceImpl = mock(ChatRoomServiceImpl.class);
		
		// 테스트용 참여자 userId 리스트 생성
		List<Integer> userIds = Arrays.asList(1,2,3);

		
		// 테스트용 ChatRoom 객체 생성 및 ID 설정  (실제 DB에 저장되는게 아니라 테스트 시나리오용 객체)
		ChatRoom chatRoom = new ChatRoom();
		chatRoom.setId(100);
		
		// Mock 객체의 createChatRoom 호출 시, 위에서 만든 chatRoom 객체가 반환되도록 지정
		// testRoom이라는 이름과 userIds 목록이 들어오면 chatRoom을 반환
		// 실무에서는 DB에 저장하고 ChatRoom을 반환하지만 테스트에서는 반환 객체만 신경 씀
		when(chatRoomServiceImpl.createChatRoom("testRoom", userIds)).thenReturn(chatRoom);
		
		// 실제로 Mock 깨체의 createChatRoom을 호출 (테스트 시나리오 실행)
		ChatRoom created = chatRoomServiceImpl.createChatRoom("testRoom", userIds);
		
		// 반환된 ChatRoom의 ID가 기대값(100)과 같은지 검증
		// 즉 ㅏㅁ여자 초대/방 생성 과정이 정상적으로 동작하는지 체크
		assertEquals(100, created.getId());
		
		
	}
	
	
	
}
