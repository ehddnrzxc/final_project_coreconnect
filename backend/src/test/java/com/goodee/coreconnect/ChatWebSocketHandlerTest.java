package com.goodee.coreconnect;

import java.util.Arrays;
import java.util.HashMap;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;


import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;
import java.lang.reflect.Field;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;

import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;

import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.approval.repository.TemplateRepository;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.chat.service.ChatRoomServiceImpl;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
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
	
	@Autowired
	DataSource dataSource;
	
	@Autowired
	TemplateRepository templateRepository;
	
	@Autowired
	DocumentRepository documentRepository;
	
	@Autowired
	private PlatformTransactionManager transactionManager;
	
	@Autowired
	private WebSocketDeliveryService webSocketDeliverService;
	
	
	@LocalServerPort
	int port;

	// 각 테스트 메서드 실행 전에 항상 이 메서드를 먼저 실행함 (테스트 준비)
	@BeforeEach
	void setUP() {
		// this를 사용하여 Mockitor가 @Mock으로 선언된 필드들을 초기화 (가짜 객체 생성 및 주입)
		MockitoAnnotations.openMocks(this);
		
		// 테스트용 ChatWebSocketHandler 인스턴스 생성
		// 생성자에 필요한 의존성(Mock개체들)을 주입
		/* handler = new WebSocketHandler(jwtProvider, userRepository, chatRoomService, notificationRepository, documentRepository);*/
	}
	
	@Test
	@DisplayName("1. ChatWebSocketHandler WebSocket 연결/해제 & 실시간 채팅 메시지 푸시 테스트")
	void testWebSocketConnection() throws Exception {
	   
		// 1. 테스트 사용자 준비: 실제 계정 사용
		String email = "choimeeyoung2@gmail.com";
		User user = userRepository.findByEmail(email).orElseThrow();
		Role role = user.getRole();
		
		// 채팅방 직접 생성
		List<Integer> userIds = Arrays.asList(user.getId());
		ChatRoom chatRoom = chatRoomService.createChatRoom("테스트방", userIds, email);
		int roomId = chatRoom.getId();		
		
		// 2. JWT 토큰 발급
		String accessToken = jwtProvider.createAccess(email, role, 10); // 10분짜리 액세스 토큰 
		
		// 3. WebSocket 클라이언트 준비
	    BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
	    TextWebSocketHandler clientHandler = new TextWebSocketHandler() {
	        @Override
	        public void handleTextMessage(WebSocketSession session, TextMessage message) {
	            receivedMessages.add(message.getPayload());
	        }
	    };

	    // 4. 서버에 WebSocket 연결
	    String wsUri = "ws://localhost:" + port + "/ws/chat?accessToken=" + accessToken;
	    StandardWebSocketClient client = new StandardWebSocketClient();
	    WebSocketSession session = client.doHandshake(clientHandler, wsUri).get();
		
	    // 5. 연결 후 세션이 정상적으로 등록되는지 검증 (핸들러 내부 세션 맵은 직접 접근 불가, 실시간 메시지로 간접 검증)
	    assertTrue(session.isOpen(), "WebSocket 세션이 정상적으로 오픈되어야 합니다.");

	    // 6. 채팅 메시지 전송 및 실시간 푸시 검증
	    String chatContent = "테스트 채팅 메시지입니다!";
	    String chatPayload = "{ \"type\": \"CHAT\", \"roomId\": " + roomId + ", \"content\": \"" + chatContent + "\" }";
	    session.sendMessage(new TextMessage(chatPayload));
	    String chatResponse = receivedMessages.poll(5, TimeUnit.SECONDS);
	    log.info("실시간 채팅 응답: {}" + chatResponse);
	    assertNotNull(chatResponse, "서버로부터 채팅 응답 메시지를 받아야 합니다.");
	    assertTrue(chatResponse.contains(chatContent), "채팅 응답에 메시지 내용이 포함되어야 합니다.");

	    // 7. 연결 해제 테스트
	    session.close(CloseStatus.NORMAL);
	    assertFalse(session.isOpen(), "WebSocket 세션이 정상적으로 닫혀야 합니다.");
	   
	}
	
	
	@Test
	@DisplayName("NotificationWebSocketHandler WebSocket 연결/해제 & 실시간 알림 푸시 테스트")
	void testNotificationWebSocketConnection() throws Exception {
		// 1. 테스트 사용자 준비 : 실제 계정 사용
		String email = "choimeeyoung2@gmail.com";
		User user = userRepository.findByEmail(email).orElseThrow(null);
		Role role = user.getRole();
		
		// 2. JWT 토큰 발급 
		String accessToken = jwtProvider.createAccess(email, role, 10);
		
		// 3. WebSocket 클라이언트 준비
		BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
		TextWebSocketHandler clientHandler = new TextWebSocketHandler() {
			protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
				receivedMessages.add(message.getPayload());
			}
		};
		
		// 4. 서버에 WebSocket 연결
		WebSocketHttpHeaders headers = new WebSocketHttpHeaders();

		String wsUri = "ws://localhost:" + port + "/ws/notification?accessToken=" + accessToken;
		StandardWebSocketClient client = new StandardWebSocketClient();
		WebSocketSession session = client.execute(clientHandler, wsUri, headers).get();
		
		assertTrue(session.isOpen(), "WebSocket 세션이 정상적으로 오픈되어야 합니다.");
		
		// 5. 알림 메시지 전송 및 실시간 푸시 검증
		String notificationPayload =  "{ \"recipientId\": " + user.getId() + ", \"type\": \"EMAIL\", \"message\": \"새 이메일이 왔습니다\" }";
		session.sendMessage(new TextMessage(notificationPayload));
		
		String response = receivedMessages.poll(5, TimeUnit.SECONDS);
		log.info("실시간 알림 응답: {}" + response);
		assertNotNull(response, "서버로부터 알림 응답 메시지를 받아야 합니다.");
	}
	
	
	
	@Test
	@DisplayName("2. 채팅방 생성/초대/참여자 관리")
	void testCreatedChatRoomANdInvite() throws Exception {
		   List<Integer> userIds = Arrays.asList(37,38,39,40,41);

	        String roomName = "testRoom";
	        String roomType = userIds.size() == 1 ? "alone" : "group";
	        Boolean favoriteStatus = false;

	        
	        
	        // 진짜 DB에 저장
	        ChatRoom created = chatRoomService.createChatRoom(roomName, userIds, "choimeeyoung2@gmail.com");

	        assertNotNull(created.getId());
	        assertEquals(roomName, created.getRoomName());
	        // 추가 검증 가능: 참여자 수, roomType 등
	}
	
	
	@Test
	@DisplayName("실제 DB에 채팅방 생성/참여자 저장 테스트")
	void testCreateChatRoomAndInviteRealDb() {
		// 이미 DB에 존재하는 이메일로 User 조회
		User user1 = userRepository.findByEmail("admin@example.com").orElseThrow();
//		User user2 = userRepository.findByEmail("choimeeyoung2@gmail.com").orElseThrow();
//		User user3 = userRepository.findByEmail("ehddnras@gmail.com").orElseThrow();
		
	
		List<Integer> userIds = Arrays.asList(user1.getId());
		
		// 실제 방 생성
		ChatRoom chatRoom = chatRoomService.createChatRoom("testRoom", userIds, user1.getEmail());
		
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
            log.info(">>> 현재 연결된 DB 정보");
            log.info("DB URL: {} " + conn.getMetaData().getURL());
            log.info("DB User: " + conn.getMetaData().getUserName());
            log.info("DB Product: " + conn.getMetaData().getDatabaseProductName());
            log.info("DB Version: " + conn.getMetaData().getDatabaseProductVersion());

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
		ChatRoom chatRoom = chatRoomService.createChatRoom("alarmTestRoom3", userIds, "choimeeyoung2@gmail.com");
		
		// 4. 메시지 저장 및 알림 생성
		String messageContent = "실제 메시지 전송 테스트3";
		chatRoomService.sendChatMessage(chatRoom.getId(), userIds.get(0), messageContent);
		
		// 파일 메시지 저장 예시 (파일 메시지 테스트)
		MessageFile file = MessageFile.createMessageFile("test.pdf", 12345.0, "chatfiles/test.pdf", null);
		chatRoomService.sendChatMessage(chatRoom.getId(), userIds.get(0), file);
		
		// 5. 메시지가 저장됐는지 확인
		List<Chat> chats = chatRepository.findByChatRoomId(chatRoom.getId());
		assertFalse(chats.isEmpty(), "메시지가 DB에 저장되어야 함");
		assertTrue(chats.stream().anyMatch(c -> messageContent.equals(c.getMessageContent())));
		 // 6. 실시간 푸시 및 알림 검증은 별도의 WebSocket 핸들러 테스트에서 수행
	}
	
	@Test
	@DisplayName("실제 사용자 JWT로 WebSocket 연결 및 메시지 전송/수신 테스트")
	void testWebSocketRealTimeMessageSend() throws Exception {
		
		
		// 1. 테스트 사용자 준비: DB에 있는 계정 사용
		String email = "109kms@naver.com";
		User user = userRepository.findByEmail(email).orElseThrow();
		Role role = user.getRole();
		
		// 2. JWT 토큰 발급
		String accessToken = jwtProvider.createAccess(email, role, 10); // 10분짜리 액세스 토큰

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
        		"{ \"type\": \"%s\", \"roomId\": 3 }",
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
		String chatContent = "안녕하세요 김민석 입니다~~";
		String chatPayload = "{ \"type\": \"CHAT\", \"roomId\": 3, \"content\": \"" + chatContent + "\" }";
		session.sendMessage(new TextMessage(chatPayload));
		
		String chatResponse = receivedMessages.poll(5, TimeUnit.SECONDS);
		System.out.println("채팅 응답: " + chatResponse);
		assertNotNull(chatResponse, "서버로부터 채팅 응답 메시지를 받아야 합니다.");
		
		// 9. DB에서 알림 메시지 검증 (CHAT 타입: content 포함)
		// DB에서 chatContent(사용자 메시지)가 알림 메시지에 제대로 포함되어 있는지 검증.
	    notifications = notificationRepository.findByUserId(user.getId());
	 // Chat 테이블에서 메시지 검증
	    List<Chat> chats = chatRepository.findByChatRoomId(3);
	    boolean foundChat = chats.stream()
	        .anyMatch(c -> c.getMessageContent() != null && c.getMessageContent().contains(chatContent));
	    assertTrue(foundChat, "DB에 채팅 메시지(content)가 저장되어야 합니다.");
	}
	

	@Test
	@DisplayName("전자결재 문서 등록/알림 생성 & 삭제/알림 soft-delete 통합 테스트")
	void testApprovalDocumentWebSocketLifecycle2() throws Exception {
		// 1. 실제 사용자 계정 준비
		User user = userRepository.findAll().get(3); // 첫 번째 계정 사용
		String email = user.getEmail();
		
		// 2. JWT 토큰 발급
		Role role = user.getRole();
		String accessToken = jwtProvider.createAccess(email, role, 10);
		
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
//		String docTitle = "테스트 결재 문서1";
//		String docContent = "결재 문서 내용1";
		
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
			"{ \"type\": \"APPROVAL\", \"docId\": %d }", 15
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
	            && n.getDocument().getId().equals(15)
	            && n.getNotificationDeletedYn() != Boolean.TRUE)
	        .findFirst()
	        .orElseThrow(() -> new AssertionError("APPROVAL 알림이 DB에 저장되어야 함"));

	    String expectedMessage = user.getName() + "님이 전자결재 문서를 등록했습니다.";
	    assertEquals(expectedMessage, approvalNotification.getNotificationMessage());

	    // 8. 문서 삭제 요청 (서비스 직접 호출)
	    //chatRoomService.deleteDocumentAndNotification(15);

	    // 9. 문서 삭제 상태 검증
	    //Document deletedDoc = documentRepository.findById(15).orElseThrow();
	    //assertTrue(deletedDoc.getDocDeletedYn(), "문서가 삭제 상태여야 함");

	    // 10. 알림 soft-delete 상태 검증 (알림이 비활성화되어야 함)
	   // Notification deletedNotification = notificationRepository.findById(approvalNotification.getId()).orElseThrow();
	    //assertTrue(deletedNotification.getNotificationDeletedYn(), "알림이 soft-delete 상태여야 함");

	}
	
	@Test
	@DisplayName("통합 테스트")
	void testApprovalDocumentWebSocketLifecycle() throws Exception {
	    // 1. 실제 사용자 계정 준비
	    User user = userRepository.findAll().get(2);

	    // 2. 문서/템플릿 저장을 별도 트랜잭션으로 실행
	    TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
	    Document savedDocument = txTemplate.execute(status -> {
	        Template template = Template.createTemplate("기본 결재 템플릿9", "템플릿 내용9", user);
	        template = templateRepository.save(template);
	        templateRepository.flush();

	        Document document = Document.createDocument(template, user, "테스트 결재 문서9", "결재 문서 내용9");
	        document.markDeleted(false); 
	        Document savedDoc = documentRepository.save(document);
	        documentRepository.flush();

	        return savedDoc;
	    });

	    // 3. WebSocket 및 검증 (이제 DB에 데이터가 있음)
	    // ... 이하 기존 코드에서 savedDocument.getId() 사용 ...
	}
	
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
	
	 @Test
	 @DisplayName("실시간 알림 WebSocket 푸시 테스트")
	 void testNotificationWebSocketPush() throws Exception {
	     BlockingQueue<String> receivedMessages = new LinkedBlockingQueue<>();
	     TextWebSocketHandler clientHandler = new TextWebSocketHandler() {
	         @Override
	         public void handleTextMessage(WebSocketSession session, TextMessage message) {
	             receivedMessages.add(message.getPayload());
	         }
	     };

	     String email = "choimeeyoung2@gmail.com";
	     User user = userRepository.findByEmail(email).orElseThrow();
	     String accessToken = jwtProvider.createAccess(email, user.getRole(), 10);

	     String wsUri = "ws://localhost:" + port + "/ws/notification?accessToken=" + accessToken;
	     StandardWebSocketClient client = new StandardWebSocketClient();
	     WebSocketSession session = client.doHandshake(clientHandler, wsUri).get();

	     // 알림 메시지 전송
	     String notificationPayload = "{ \"recipientId\": " + user.getId() + ", \"type\": \"EMAIL\", \"message\": \"새 이메일이 왔습니다\" }";
	     session.sendMessage(new TextMessage(notificationPayload));

	     // 실시간 푸시 메시지 수신 검증
	     String response = receivedMessages.poll(5, TimeUnit.SECONDS);
	     assertNotNull(response);
	     assertTrue(response.contains("새 이메일이 왔습니다"));
	 }
	
}
