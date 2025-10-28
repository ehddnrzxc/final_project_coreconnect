package com.goodee.coreconnect;

import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.setExtractBareNamePropertyMethods;
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
import java.util.concurrent.BlockingDeque;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.annotation.Commit;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.approval.repository.TemplateRepository;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.chat.service.ChatRoomServiceImpl;
import com.goodee.coreconnect.common.notification.NotificationSender;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * WebSocketHandler 및 채팅/알림 비즈니스 로직 테스트
 * */
@Slf4j
@SpringBootTest(webEnvironment  = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
	
	@Autowired
	TemplateRepository templateRepository;
	
	@Autowired
	DocumentRepository documentRepository;
	
	@Autowired
	private PlatformTransactionManager transactionManager;
	
	@LocalServerPort
	int port;

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
		handler = new ChatWebSocketHandler(jwtProvider, userRepository, chatRoomService, notificationRepository, documentRepository);
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
		chatRoomService.saveNotification(chatRoom.getId(), userIds.get(0), "실제 메시지 전송 테스트3", NotificationType.CHAT, null);
		
		//메시지가 저장됐는지 확인
		List<Chat> chats = chatRepository.findByChatRoomId(chatRoom.getId());
		assertFalse(chats.isEmpty(), "메시지가 DB에 저장되어야 함");
		
		// 알림이 생성됐는지 확인
		List<Notification> nofiNotifications = notificationRepository.findByChatId(chats.get(0).getId());
		assertEquals(userIds.size(), nofiNotifications.size(), "알림이 참여자 수만큼 생성되어야 함");	
	
	}
	
	@Test
	@DisplayName("실제 사용자 JWT로 WebSocket 연결 및 메시지 전송/수신 테스트")
	void testWebSocketRealTimeMessageSend() throws Exception {
		
		
		// 1. 테스트 사용자 준비: DB에 있는 계정 사용
		String email = "109kms@naver.com";
		User user = userRepository.findByEmail(email).orElseThrow();
		
		// 2. JWT 토큰 발급
		String accessToken = jwtProvider.createAccess(email, 10); // 10분짜리 액세스 토큰

		// 3. WebSocket 클라이언트 준비
		/**
		 * 테스트에서 서버로부터 오는 WebSocket 메시지를 받을 수 있도록 핸들러를 등록.
		   메시지가 오면 Queue에 저장해서 이후 검증할 수 있게 설계.
		 * 
		 * 
		 * 
		 * */
		BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
		TextWebSocketHandler clientHandler = new TextWebSocketHandler() {
			 @Override
	            public void handleTextMessage(WebSocketSession session, TextMessage message) {
	                receivedMessages.add(message.getPayload());
	            }
		};
		
		// 4. 서버에 WebSocket 연결 (accessToken 쿼리파라미터로 전달)
		/**
		 * 로컬 테스트 서버에 WebSocket으로 직접 연결.
		   accessToken을 쿼리파라미터로 전달해 인증.
           실제 서비스와 동일한 방식으로 채팅/알림 서버에 접속.
		 * */
        String wsUri = "ws://localhost:" + port + "/ws/chat?accessToken=" + accessToken;
        StandardWebSocketClient client = new StandardWebSocketClient();
        WebSocketSession session = client.doHandshake(clientHandler, wsUri).get();

        // 5. WebSocket 메시지 전송
        NotificationType type = NotificationType.EMAIL;
   
        /**
         * SCHEDULE 타입의 알림 메시지를 서버에 전송. content는 포함하지 않음(비즈니스 규칙).
           실제 일정 등록/알림 등과 똑같은 데이터 구조로 메시지 전송.
         * */
        String schedulePayload = String.format(
        		"{ \"type\": \"%s\", \"roomId\": 6 }",
        	    type.name() // "APPROVAL"
        	    
        	);
       
        session.sendMessage(new TextMessage(schedulePayload));

        // 6. 서버에서 발송된 응답/알림 메시지 수신 및 검증 (5초 이내 도착)
        /**
         * 서버가 WebSocket을 통해 클라이언트에게 실시간 메시지를 push하면, 클라이언트가 해당 메시지를 수신.
           메시지가 정상적으로 수신되는지 5초 내에 검증.
         * */
        String response = receivedMessages.poll(5, TimeUnit.SECONDS);
        System.out.println("서버 응답: " + response);

        assertNotNull(response, "서버로부터 응답 메시지를 받아야 합니다.");
        
		
		// 7. DB에서 알림 메시지 검증 (SCHEDULE 타입)
        /**
         * 알림(Notification) 테이블에서 해당 사용자에게 전송된 알림이 제대로 저장됐는지 검증.
           SCHEDULE 타입은 비즈니스 로직대로 알림 메시지가 content 없이 생성됐는지 체크.
         * */
		List<Notification> notifications = notificationRepository.findByUserId(user.getId());
		// SCHEDULE 검증
		boolean foundSchedule = notifications.stream()
			    .filter(n -> n.getNotificationType() != null)
			    .anyMatch(n -> n.getNotificationType() == NotificationType.EMAIL
			        && n.getNotificationMessage() != null
			        && n.getNotificationMessage().contains("이메일이 도착했습니다."));
		assertTrue(foundSchedule, "DB에 APPROVAL 알림 메시지가 올바르게 저장되어야 합니다.");
		
		// 8. CHAT 타입 메시지 전송 및 검증
		/**
		 * CHAT 타입 메시지를 서버에 전송. content에 실제 채팅 메시지가 포함됨.
           서버가 실시간으로 메시지를 push하면 정상적으로 수신되는지 검증.
		 * */
		String chatContent = "채팅 테스트 메시지7";
		String chatPayload = "{ \"type\": \"CHAT\", \"roomId\": 6, \"content\": \"" + chatContent + "\" }";
		session.sendMessage(new TextMessage(chatPayload));
		
		String chatResponse = receivedMessages.poll(5, TimeUnit.SECONDS);
		System.out.println("채팅 응답: " + chatResponse);
		assertNotNull(chatResponse, "서버로부터 채팅 응답 메시지를 받아야 합니다.");
		
		// 9. DB에서 알림 메시지 검증 (CHAT 타입: content 포함)
		// DB에서 chatContent(사용자 메시지)가 알림 메시지에 제대로 포함되어 있는지 검증.
	    notifications = notificationRepository.findByUserId(user.getId());
	    // CHAT 검증
	    boolean foundChat = notifications.stream()
	    	    .filter(n -> n.getNotificationType() != null)
	    	    .anyMatch(n -> n.getNotificationType() == NotificationType.CHAT
	    	        && n.getNotificationMessage() != null
	    	        && n.getNotificationMessage().contains(chatContent));
	    assertTrue(foundChat, "DB에 CHAT 알림 메시지에 사용자 메시지(content)가 포함되어야 합니다.");
	}
	

	@Test
	@DisplayName("전자결재 문서 등록/알림 생성 & 삭제/알림 soft-delete 통합 테스트")
	void testApprovalDocumentWebSocketLifecycle2() throws Exception {
		// 1. 실제 사용자 계정 준비
		User user = userRepository.findAll().get(4); // 첫 번째 계정 사용
		String email = user.getEmail();
		
		// 2. JWT 토큰 발급
		String accessToken = jwtProvider.createAccess(email, 10);
		
		// 3. WebSocket 연결/클라이언트 준비
		BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
	    TextWebSocketHandler clientHandler = new TextWebSocketHandler() {
	        @Override
	        public void handleTextMessage(WebSocketSession session, TextMessage message) {
	            receivedMessages.add(message.getPayload());
	        }
	    };
	    String wsUri = "ws://localhost:" + port + "/ws/chat?accessToken=" + accessToken;
	    StandardWebSocketClient client = new StandardWebSocketClient();
	    WebSocketSession session = client.doHandshake(clientHandler, wsUri).get();
		
	    // 4. 전자결재 문서 등록 요청 (WebSocket)
		String docTitle = "테스트 결재 문서1";
		String docContent = "결재 문서 내용1";
		
//		// Template 생성
//		Template template = Template.createTemplate("기본 결재 템플릿1", "템플릿 내용1", user);
//		template = templateRepository.save(template);
//		
//		// Document 생성
//		Document document = Document.createDocument(template, user, docTitle, docContent);
//		document.setDocDeletedYn(false);
//		Document savedDocument = documentRepository.save(document);
//		documentRepository.flush();
	    
		// 5. WwbSocket으로 APPROVAL 알림 전송
		String approvalPayload = String.format(
			"{ \"type\": \"APPROVAL\", \"docId\": %d }", 9
		);
		
		session.sendMessage(new TextMessage(approvalPayload));
		
		// 6. 서버에서 수신한 알림 메시지 검증 (실시간 push)
	    String approvalResponse = receivedMessages.poll(5, TimeUnit.SECONDS);
	    System.out.println("전자결재 알림 응답: " + approvalResponse);
	    assertNotNull(approvalResponse, "서버로부터 APPROVAL 알림 메시지를 받아야 합니다.");

	    // 7. DB 알림(Notification) 생성 확인
	    List<Notification> notifications = notificationRepository.findByUserId(user.getId());
	    Notification approvalNotification = notifications.stream()
	        .filter(n -> n.getNotificationType() == NotificationType.APPROVAL
	            && n.getDocument() != null
	            && n.getDocument().getId().equals(9)
	            && n.getNotificationDeletedYn() != Boolean.TRUE)
	        .findFirst()
	        .orElseThrow(() -> new AssertionError("APPROVAL 알림이 DB에 저장되어야 함"));

	    String expectedMessage = user.getName() + "님이 전자결재 문서를 등록했습니다.";
	    assertEquals(expectedMessage, approvalNotification.getNotificationMessage());

	    // 8. 문서 삭제 요청 (서비스 직접 호출)
	    chatRoomService.deleteDocumentAndNotification(9);

	    // 9. 문서 삭제 상태 검증
	    Document deletedDoc = documentRepository.findById(9).orElseThrow();
	    assertTrue(deletedDoc.getDocDeletedYn(), "문서가 삭제 상태여야 함");

	    // 10. 알림 soft-delete 상태 검증 (알림이 비활성화되어야 함)
	    Notification deletedNotification = notificationRepository.findById(approvalNotification.getId()).orElseThrow();
	    assertTrue(deletedNotification.getNotificationDeletedYn(), "알림이 soft-delete 상태여야 함");

	}
	
	@Test
	@DisplayName("통합 테스트")
	void testApprovalDocumentWebSocketLifecycle() throws Exception {
	    // 1. 실제 사용자 계정 준비
	    User user = userRepository.findAll().get(2);

	    // 2. 문서/템플릿 저장을 별도 트랜잭션으로 실행
	    TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
	    Document savedDocument = txTemplate.execute(status -> {
	        Template template = Template.createTemplate("기본 결재 템플릿3", "템플릿 내용3", user);
	        template = templateRepository.save(template);
	        templateRepository.flush();

	        Document document = Document.createDocument(template, user, "테스트 결재 문서3", "결재 문서 내용3");
	        document.setDocDeletedYn(false);
	        Document savedDoc = documentRepository.save(document);
	        documentRepository.flush();

	        return savedDoc;
	    });

	    // 3. WebSocket 및 검증 (이제 DB에 데이터가 있음)
	    // ... 이하 기존 코드에서 savedDocument.getId() 사용 ...
	}
}
