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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import javax.sql.DataSource;

import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.chat.service.ChatRoomServiceImpl;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * WebSocketHandler 및 채팅/알림 비즈니스 로직 테스트
 * */
@Slf4j
@SpringBootTest
@TestPropertySource(locations = "classpath:application.properties")
public class ChatWebSocketHandlerTest {

	@Autowired
	ChatRoomService chatRoomService;
	
	@Autowired
	UserRepository userRepository;
	
	@Autowired
	JwtProvider jwtProvider;
	
	@Autowired
	NotificationRepository notificationRepository;
	
	@Autowired
	ChatRepository chatRepository;
		
	ChatWebSocketHandler handler;	
	
	@Autowired
	DataSource dataSource;

	@Test
	void testDatabaseConnectionInfo() throws Exception {
	    try (Connection conn = dataSource.getConnection()) {
	        String dbUrl = conn.getMetaData().getURL();                    // 실제 접속한 DB의 URL
	        String dbUser = conn.getMetaData().getUserName();              // 접속한 DB의 사용자명
	        String dbProduct = conn.getMetaData().getDatabaseProductName();// DB 종류 (MySQL 등)
	        String dbVersion = conn.getMetaData().getDatabaseProductVersion();// DB 버전

	        System.out.println("DB 연결 성공!");
	        System.out.println("DB URL: " + dbUrl);
	        System.out.println("DB User: " + dbUser);
	        System.out.println("DB Product: " + dbProduct);
	        System.out.println("DB Version: " + dbVersion);

	        assertNotNull(conn);
	        assertNotNull(dbUrl);
	        assertNotNull(dbUser);
	    }
	}
	
	 @Test
    void testPrintAllUsers() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
             System.out.println("----- users 테이블 전체 데이터 -----");
             int count = 0;
             while (rs.next()) {
                // 필요한 컬럼명에 맞게 출력 (예시: user_id, user_email, user_name 등)
                int id = rs.getInt("user_id");
                String email = rs.getString("user_email");
                String name = rs.getString("user_name");
                String role = rs.getString("user_role");
                String status = rs.getString("user_status");
                System.out.printf("user_id=%d, user_email=%s, user_name=%s, user_role=%s, user_status=%s\n",
                        id, email, name, role, status);
                count++;
             }
             System.out.println("총 " + count + "명의 사용자 데이터가 조회되었습니다.");
        }
    }
	
	
	
	
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
	
	
	@Test
	@DisplayName("실제 DB에 채팅방 생성/참여자 저장 테스트")
	void testCreateChatRoomAndInviteRealDb() {
		// 이미 DB에 존재하는 이메일로 User 조회
		//User user1 = userRepository.findByEmail("yoochun8128@gmail.com").orElseThrow();
		//User user2 = userRepository.findByEmail("choimeeyoung2@gmail.com").orElseThrow();
		User user3 = userRepository.findByEmail("ehddnras@gmail.com").orElseThrow();
		
	
		List<Integer> userIds = Arrays.asList(  user3.getId());
		
		// 실제 방 생성
		ChatRoom chatRoom = chatRoomService.createChatRoom("testRoom", userIds);
		
		// PK는 자동생성! 직접 setId() 안함
		assertNotNull(chatRoom.getId());
		log.info("생성된 채팅방 PK: " + chatRoom.getId());
		
		// DB에서 직접 조회
		ChatRoom foundRoom = chatRoomService.findById(chatRoom.getId());
		assertEquals("testRoom", foundRoom.getRoomName());
	}
	
	
	@Test
    void testJPASelectQueryEmail() throws Exception {
        String targetEmail = "ehddnras@gmail.com";
        try (Connection conn = dataSource.getConnection()) {
            // DB 정보 출력
            System.out.println(">>> 현재 연결된 DB 정보");
            System.out.println("DB URL: " + conn.getMetaData().getURL());
            System.out.println("DB User: " + conn.getMetaData().getUserName());
            System.out.println("DB Product: " + conn.getMetaData().getDatabaseProductName());
            System.out.println("DB Version: " + conn.getMetaData().getDatabaseProductVersion());

            // 현재 DB(스키마) 이름 확인 (MySQL 기준)
            try (PreparedStatement stmt = conn.prepareStatement("SELECT DATABASE()")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String dbName = rs.getString(1);
                        System.out.println("현재 DB 스키마 이름: " + dbName);
                    }
                }
            }

            // 실제 쿼리와 결과 확인
            String sql = "SELECT * FROM users WHERE user_email = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, targetEmail);
                try (ResultSet rs = stmt.executeQuery()) {
                    System.out.println("실행한 쿼리: " + sql.replace("?", "'" + targetEmail + "'"));
                    boolean found = false;
                    while (rs.next()) {
                        found = true;
                        int id = rs.getInt("user_id");
                        String email = rs.getString("user_email");
                        String name = rs.getString("user_name");
                        String role = rs.getString("user_role");
                        String status = rs.getString("user_status");
                        System.out.printf("조회 결과 - user_id=%d, user_email=%s, user_name=%s, user_role=%s, user_status=%s\n",
                                id, email, name, role, status);
                    }
                    if (!found) {
                        System.out.println("해당 이메일(" + targetEmail + ")의 유저는 DB에 존재하지 않습니다.");
                    }
                }
            }
        }
    }
	
	
	@Test
	@DisplayName("Service/Repository로 2번방 roomType을 alone으로 변경")
	void testUpdateRoomTypeToAloneWithService() {
		// 1. 기존 1번 방 조회
		ChatRoom room = chatRoomService.findById(2);
		assertNotNull(room, "2번 방이 존재해야 함");
		log.info("변경전 roomType: " + room.getRoomType());
		
		// 2. 방의 roomType을 alone으로 변경
		ChatRoom updatedRoom = chatRoomService.updateRoomType(2, "alone");
		assertEquals("alone", updatedRoom.getRoomType());
		log.info("변경후 roomType: " + updatedRoom.getRoomType());		
	}
	
	@Test
	@DisplayName("3. 메시지 전송/알림 전송/수신자 전달 - 실제 DB 테스트")
	void testSendMessageAndAlarm() {
		// 채팅방과 참여자 준비
		// 1. DB에 저장된 모든 사용자(User) 정보를 전부 가져온다
		List<User> users = userRepository.findAll();

		// 2. 가져온 사용자 중 앞에서 최대 3명까지의 ID만 추린다
		// stream을 쓰면 여러가지 연산 (map, filter, collect등)을 연결해서 한번에 처리할 수 있다
		// ::의미 : 메서드 참조
		List<Integer> userIds = users.subList(0, Math.min(users.size(), 4)).stream().map(User::getId).toList();
	
		// 3. 채팅방을 하나 새로 만든다
		ChatRoom chatRoom = chatRoomService.createChatRoom("alarmTestRoom3", userIds);
		
		// 메시지 저장 및 알림 생성
		chatRoomService.saveNotification(chatRoom.getId(), userIds.get(0), "실제 메시지 전송 테스트3", NotificationType.CHAT);
		
		//메시지가 저장됐는지 확인
		List<Chat> chats = chatRepository.findByChatRoomId(chatRoom.getId());
		assertFalse(chats.isEmpty(), "메시지가 DB에 저장되어야 함");
		
		// 알림이 생성됐는지 확인
		List<Notification> nofiNotifications = notificationRepository.findByChatId(chats.get(0).getId());
		assertEquals(userIds.size(), nofiNotifications.size(), "알림이 참여자 수만큼 생성되어야 함");	
	
	}
	

	
	
	
}
