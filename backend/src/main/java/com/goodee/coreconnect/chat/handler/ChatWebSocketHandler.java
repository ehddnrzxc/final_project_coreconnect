package com.goodee.coreconnect.chat.handler;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;
import com.goodee.coreconnect.chat.repository.ChatMessageReadStatusRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler{	
	// ⭐ 여러 브라우저/탭 지원: 사용자 ID별 WebSocketSession 리스트 관리
	// 한 사용자가 여러 브라우저/탭에서 접속할 수 있으므로 List로 관리
	// 모든 세션이 끊겨야만 "미접속"으로 처리됨
	public static final Map<Integer, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
	
	// 채팅방 관련 서비스
    private final ChatRoomService chatRoomService;
    // JWT 토큰 파싱을 위한 프로바이더
    private final JwtProvider jwtProvider;
    // 사용자 정보 조회용 레포지토리
    private final UserRepository userRepository;
    
    private final ChatMessageReadStatusRepository chatMessageReadStatusRepository;
    
    // 실시간 메시지 전송을 위한 공통 서비스
    private final WebSocketDeliveryService webSocketDeliveryService;

    // JSON 파싱을 위한 ObjectMapper (JavaTimeModule 등록)
    private final ObjectMapper objectMapper = new ObjectMapper()
    		.registerModule(new JavaTimeModule())
    		.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);// ISO8601 포맷으로 직렬화
    
    //private final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
    // 클라잉너트 websocket 연결 시 호출
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    	// JWT에서 사용자 ID 추출
    	Integer userId = getUserIdFromSession(session);
    	Integer roomId = getRoomIdFromSession(session);
    	
    	log.info("afterConnectionEstablished - userId: {}", userId);
        log.info("afterConnectionEstablished - roomId: {}", roomId);
        
        // 반드시 session attributes에 roomId 넣기! (이걸 빼먹으면 연결 추적 불가능)
        if (roomId != null) {
            session.getAttributes().put("roomId", roomId);
            log.info("session.getAttributes().put(roomId): {}", roomId);
        } else {
            log.warn("WebSocket 연결에 roomId 없음 - 클라이언트 URI query를 확인하세요.");
        }

        // ⭐ 세션 맵에 등록 - 여러 브라우저/탭 지원을 위해 List로 관리
        if (userId != null) {
            // ⭐ 동시성 안전: computeIfAbsent로 리스트 초기화 후 세션 추가
            userSessions.computeIfAbsent(userId, k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(session);
            webSocketDeliveryService.registerSession(userId, session);

            int sessionCount = userSessions.get(userId).size();
            log.info("userSessions 세션 추가 완료 - userId: {}, roomId: {}, 현재세션수: {}", 
                    userId, roomId, sessionCount);

            // 방 입장시 안읽은 메시지 읽음 처리
            if (roomId != null) {
                chatRoomService.markMessagesAsRead(roomId, userId);
            }
        } else {
            log.warn("WebSocket 연결에 userId 없음 - JWT token/Authorization 문제 체크!");
        }
    }
    
    // 클라이언트(WebSocket) 연결 해제 시 호출
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// 사용자 ID 추출
		Integer userId = getUserIdFromSession(session);
		Integer roomId = getRoomIdFromSession(session);
		String sessionId = session != null ? session.getId() : "null";
		
		log.info("[afterConnectionClosed] 세션 종료 시작 - userId: {}, roomId: {}, sessionId: {}, closeStatus: {}", 
				userId, roomId, sessionId, status);
		
		if (userId != null) {
			// ⭐ 여러 브라우저/탭 지원: 특정 세션만 리스트에서 제거
			// 모든 세션이 끊겨야만 userId가 완전히 제거됨
			List<WebSocketSession> sessions = userSessions.get(userId);
			if (sessions != null && !sessions.isEmpty()) {
				// ⭐ 세션 ID로 비교하여 정확한 세션만 제거
				boolean removed = sessions.removeIf(s -> s != null && s.getId().equals(sessionId));
				
				if (!removed) {
					// ⭐ 세션 ID로 찾지 못하면 객체 참조로 제거 시도
					removed = sessions.remove(session);
					if (!removed) {
						log.warn("[afterConnectionClosed] 세션 제거 실패 - userId: {}, sessionId: {}, sessions.size: {}", 
								userId, sessionId, sessions.size());
					}
				}
				
				webSocketDeliveryService.unregisterSession(userId, session);
				
				// ⭐ 모든 세션이 끊겼으면 userId도 제거
				if (sessions.isEmpty()) {
					userSessions.remove(userId);
					log.info("[afterConnectionClosed] ✅ 모든 세션 제거 완료 - userId: {}, roomId: {}, userId 맵에서도 제거", 
							userId, roomId);
				} else {
					log.info("[afterConnectionClosed] ✅ 세션 제거 완료 - userId: {}, roomId: {}, 남은 세션수: {}, 남은 세션Ids: {}", 
							userId, roomId, sessions.size(), 
							sessions.stream().map(s -> s != null ? s.getId() : "null").collect(Collectors.toList()));
				}
			} else {
				log.warn("[afterConnectionClosed] ⚠️ userId: {}의 세션 리스트가 없거나 비어있음", userId);
			}
		} else {
			log.warn("[afterConnectionClosed] ⚠️ userId를 찾을 수 없어 세션 제거 실패 - sessionId: {}", sessionId);
		}
	}
	
	// 텍스트 메시지 수신 시 실행되는 콜백
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    JsonNode node = objectMapper.readTree(message.getPayload());
	    Integer senderId = getUserIdFromSession(session);

	    Integer roomId = node.has("roomId") ? node.get("roomId").asInt() : null;
	    String chatContent = node.has("content") ? node.get("content").asText() : null;
	    if (roomId == null || chatContent == null) return;

	    // 🚨 [roomId의 실제 존재 여부 검증]
	    // chatRoomService.findRoomById(roomId) 또는 getRoomById 등의 메서드를 사용
	    // 반환값이 Optional<ChatRoom> 또는 ChatRoom, null 등일 경우
	    // (아래는 존재 확인 후 예외처리 log 남기고 처리 중단)
	    if (!chatRoomService.existsRoom(roomId)) { // 이 메서드는 직접구현 필요!
	        log.error("handleTextMessage: roomId {}는 실제 DB에 존재하지 않습니다. 메시지 푸시 중단!", roomId);
	        return;
	    }

	    // 전체 참가자
	    List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);
	    log.info("senderId: {}", senderId);
	    log.info("participantIds: {}", participantIds);

	    // 본인 제외 - Objects.equals로 안전 비교
	    List<Integer> otherParticipantIds = participantIds.stream()
	        .filter(pid -> senderId != null && !Objects.equals(pid, senderId))
	        .collect(Collectors.toList());
	    log.info("otherParticipantIds: {}", otherParticipantIds);

	    // 접속중인 인원 리스트 - 본인 제외
	    List<Integer> connectedUserIds = getConnectedUserIdsInRoom(roomId);
	    log.info("connectedUserIds: {}", connectedUserIds);

	    List<Integer> otherConnectedUserIds = connectedUserIds.stream()
	        .filter(pid -> senderId != null && !Objects.equals(pid, senderId))
	        .collect(Collectors.toList());
	    log.info("otherConnectedUserIds: {}", otherConnectedUserIds);

	    // unreadCount 계산
	    int unreadCount = otherParticipantIds.size() - otherConnectedUserIds.size();
	    if (unreadCount < 0) unreadCount = 0;

	    log.info("unreadCount: {}", unreadCount);

	    ChatResponseDTO dto = chatRoomService.saveChatAndReturnDTO(roomId, senderId, chatContent, unreadCount);

	    String payload = objectMapper.writeValueAsString(dto);

	    // ⭐ 전체 참가자에게 메시지 push (여러 브라우저/탭 지원)
	    for (Integer pid : participantIds) {
	        List<WebSocketSession> sessions = userSessions.get(pid);
	        if (sessions != null) {
	            // ⭐ 해당 사용자의 모든 세션에 메시지 전송
	            for (WebSocketSession s : new ArrayList<>(sessions)) { // ConcurrentModificationException 방지
	                if (s != null && s.isOpen()) {
	                    try {
	                        s.sendMessage(new TextMessage(payload));
	                    } catch (Exception e) {
	                        log.error("메시지 전송 실패 - userId: {}, sessionId: {}, error: {}", 
	                                pid, s.getId(), e.getMessage());
	                    }
	                }
	            }
	        }
	    }

	    for (Integer offlineUserId : participantIds) {
	        String alerMsg = dto.getSenderName() + "님으로부터 새로운 채팅 메시지가 도착했습니다";
	        webSocketDeliveryService.sendToUser(offlineUserId, alerMsg);

	        String toastMsg = chatRoomService.getUnreadToadMsgForUser(offlineUserId);
	        if (toastMsg != null) {
	            webSocketDeliveryService.sendToUser(offlineUserId, toastMsg);
	        }
	    }
	}
	
	
	/**
	 * WebSocketSession에서 JWT 토큰을 파싱하여 사용자 ID 추출
	 * */
	private Integer getUserIdFromSession(WebSocketSession session) {
		
		// 헤더에서 Authorization 추출
		List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
		String token = null;
		if (authHeaders != null && !authHeaders.isEmpty()) {
			String bearer = authHeaders.get(0);
			if (bearer.startsWith("Bearer ")) {
				token = bearer.substring(7); // Bearer 제거
				log.info("getUserIdFromSession() - token: {}", token);
			}
		}
		
		// 2. 쿼리 파라미터에서 robust하게 accessToken 추출
	    if (token == null) {
	        String query = session.getUri().getQuery();
	        if (query != null) {
	            String[] params = query.split("&");
	            for (String param : params) {
	                String[] kv = param.split("=");
	                if (kv.length == 2 && kv[0].equals("accessToken")) {
	                    token = kv[1];
	                    log.info("getUserIdFromSession() - token by query: {}", token);
	                    break;
	                }
	            }
	        }
	    }
		// 토큰 없으면 null
		if (token == null) {
	        log.warn("getUserIdFromSession - JWT 토큰 없음 (헤더/쿼리 모두 없음)");
	        return null;
	    }
		try {
			// 토큰에서 이메일 추출
			String email = jwtProvider.getSubject(token);
			// 이메일로 사용자 조회
			User user = userRepository.findByEmail(email).orElse(null);
			// 사용자 ID 반환
			return user != null ? user.getId() : null;
		} catch (Exception e) {
			// 실패시 null
			return null;
		}
		
	}
	
	/**
	 * 특정 채팅방에 현재 접속 중인 사용자 ID 목록 반환
	 * ⭐ 여러 브라우저/탭 지원: 한 사용자의 여러 세션 중 하나라도 해당 방에 접속 중이면 "접속 중"으로 판단
	 * 
	 * @param roomId 채팅방 ID
	 * @return 접속 중인 사용자 ID 목록 (발신자 포함, 중복 없음)
	 */
	public List<Integer> getConnectedUserIdsInRoom(Integer roomId) {
	    List<Integer> connectedUserIds = new ArrayList<>();
	    int checkedUsers = 0;
	    int checkedSessions = 0;
	    int openSessions = 0;
	    int matchingRoomSessions = 0;
	    
	    // ⭐ 여러 브라우저/탭 지원: 각 사용자의 모든 세션을 확인
	    for (Map.Entry<Integer, List<WebSocketSession>> entry : userSessions.entrySet()) {
	        Integer userId = entry.getKey();
	        List<WebSocketSession> sessions = entry.getValue();
	        checkedUsers++;
	        
	        if (sessions == null || sessions.isEmpty()) {
	            continue;
	        }
	        
	        // ⭐ 해당 사용자의 세션 중 하나라도 해당 방에 접속 중이면 "접속 중"으로 판단
	        boolean isConnectedToRoom = false;
	        
	        for (WebSocketSession session : new ArrayList<>(sessions)) { // ConcurrentModificationException 방지
	            checkedSessions++;
	            
	            // ⭐ 세션이 null이거나 닫혀있으면 제외
	            if (session == null || !session.isOpen()) {
	                log.debug("[getConnectedUserIdsInRoom] 세션 제외 - userId: {}, sessionId: {}, isNull: {}, isOpen: {}", 
	                        userId, session != null ? session.getId() : "null", 
	                        session == null, session != null && session.isOpen());
	                continue;
	            }
	            
	            openSessions++;
	            
	            // ⭐ 세션의 roomId 속성 확인
	            Object sessionRoomId = session.getAttributes().get("roomId");
	            
	            // roomId가 Integer인 경우와 String인 경우 모두 처리
	            boolean roomMatches = false;
	            if (sessionRoomId != null) {
	                if (sessionRoomId instanceof Integer) {
	                    roomMatches = sessionRoomId.equals(roomId);
	                } else if (sessionRoomId instanceof String) {
	                    try {
	                        roomMatches = Integer.parseInt((String) sessionRoomId) == roomId;
	                    } catch (NumberFormatException e) {
	                        log.warn("[getConnectedUserIdsInRoom] roomId 파싱 실패 - userId: {}, sessionRoomId: {}", 
	                                userId, sessionRoomId);
	                    }
	                } else {
	                    // 숫자로 변환 시도
	                    try {
	                        int parsedRoomId = Integer.parseInt(sessionRoomId.toString());
	                        roomMatches = parsedRoomId == roomId;
	                    } catch (NumberFormatException e) {
	                        log.warn("[getConnectedUserIdsInRoom] roomId 변환 실패 - userId: {}, sessionRoomId: {}", 
	                                userId, sessionRoomId);
	                    }
	                }
	            }
	            
	            if (roomMatches) {
	                isConnectedToRoom = true;
	                matchingRoomSessions++;
	                log.debug("[getConnectedUserIdsInRoom] 접속자 발견 - userId: {}, roomId: {}, sessionId: {}", 
	                        userId, roomId, session.getId());
	                // ⭐ 하나라도 해당 방에 접속 중이면 중복 체크 없이 추가하고 다음 사용자로
	                break;
	            }
	        }
	        
	        // ⭐ 해당 사용자가 해당 방에 접속 중이면 리스트에 추가 (중복 방지)
	        if (isConnectedToRoom && !connectedUserIds.contains(userId)) {
	            connectedUserIds.add(userId);
	        }
	    }
	    
	    log.info("[getConnectedUserIdsInRoom] ⭐ 실시간 접속자 조회 완료 - roomId: {}, 전체사용자수: {}, 전체세션수: {}, 열린세션수: {}, 해당방접속세션수: {}, 접속자수: {}, 접속자Ids: {}", 
	            roomId, checkedUsers, checkedSessions, openSessions, matchingRoomSessions, connectedUserIds.size(), connectedUserIds);
	    
	    return connectedUserIds;
	}
	
	/**
	 * ⭐ 순환 참조 방지: static 메서드로 접속자 조회
	 * ChatRoomServiceImpl에서 호출할 때 순환 참조를 피하기 위해 static 메서드 제공
	 * 
	 * @param roomId 채팅방 ID
	 * @return 접속 중인 사용자 ID 목록 (발신자 포함, 중복 없음)
	 */
	public static List<Integer> getConnectedUserIdsInRoomStatic(Integer roomId) {
	    List<Integer> connectedUserIds = new ArrayList<>();
	    int checkedUsers = 0;
	    int checkedSessions = 0;
	    int openSessions = 0;
	    int matchingRoomSessions = 0;
	    
	    // ⭐ 여러 브라우저/탭 지원: 각 사용자의 모든 세션을 확인
	    for (Map.Entry<Integer, List<WebSocketSession>> entry : userSessions.entrySet()) {
	        Integer userId = entry.getKey();
	        List<WebSocketSession> sessions = entry.getValue();
	        checkedUsers++;
	        
	        if (sessions == null || sessions.isEmpty()) {
	            continue;
	        }
	        
	        // ⭐ 해당 사용자의 세션 중 하나라도 해당 방에 접속 중이면 "접속 중"으로 판단
	        boolean isConnectedToRoom = false;
	        
	        for (WebSocketSession session : new ArrayList<>(sessions)) { // ConcurrentModificationException 방지
	            checkedSessions++;
	            
	            // ⭐ 세션이 null이거나 닫혀있으면 제외
	            if (session == null || !session.isOpen()) {
	                continue;
	            }
	            
	            openSessions++;
	            
	            // ⭐ 세션의 roomId 속성 확인
	            Object sessionRoomId = session.getAttributes().get("roomId");
	            
	            // roomId가 Integer인 경우와 String인 경우 모두 처리
	            boolean roomMatches = false;
	            if (sessionRoomId != null) {
	                if (sessionRoomId instanceof Integer) {
	                    roomMatches = sessionRoomId.equals(roomId);
	                } else if (sessionRoomId instanceof String) {
	                    try {
	                        roomMatches = Integer.parseInt((String) sessionRoomId) == roomId;
	                    } catch (NumberFormatException e) {
	                        // 파싱 실패 시 무시
	                    }
	                } else {
	                    // 숫자로 변환 시도
	                    try {
	                        int parsedRoomId = Integer.parseInt(sessionRoomId.toString());
	                        roomMatches = parsedRoomId == roomId;
	                    } catch (NumberFormatException e) {
	                        // 변환 실패 시 무시
	                    }
	                }
	            }
	            
	            if (roomMatches) {
	                isConnectedToRoom = true;
	                matchingRoomSessions++;
	                // ⭐ 하나라도 해당 방에 접속 중이면 중복 체크 없이 추가하고 다음 사용자로
	                break;
	            }
	        }
	        
	        // ⭐ 해당 사용자가 해당 방에 접속 중이면 리스트에 추가 (중복 방지)
	        if (isConnectedToRoom && !connectedUserIds.contains(userId)) {
	            connectedUserIds.add(userId);
	        }
	    }
	    
	    return connectedUserIds;
	}
	
	// markMessagesAsRead 서비스 호출 (메시지 읽음 처리)
    private void markMessagesAsRead(Integer roomId, Integer userId) {
        chatRoomService.markMessagesAsRead(roomId, userId);
    }
    
    /**
     * WebSocketSession에서 roomId를 추출하는 메서드
     * - session.getAttributes().get("roomId") 또는
     * - session.getUri().getQuery()에서 accessToken, roomId 등을 파싱
     */
    private Integer getRoomIdFromSession(WebSocketSession session) {
        // 1. session attributes에서 roomId 추출
        Object attrRoomId = session.getAttributes().get("roomId");
        if (attrRoomId != null) {
            try {
                return Integer.parseInt(attrRoomId.toString());
            } catch (NumberFormatException e) {
                log.warn("roomId attribute is not a valid integer: {}", attrRoomId);
            }
        }

        // 2. URI query string에서 roomId=xxx 파싱 (예: ws://host?roomId=26&accessToken=xxx)
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] kv = param.split("=");
                if (kv.length == 2 && kv[0].equals("roomId")) {
                    try {
                        return Integer.parseInt(kv[1]);
                    } catch (NumberFormatException e) {
                        log.warn("roomId query param is not a valid integer: {}", kv[1]);
                    }
                }
            }
        }

        // 못 찾으면 null 반환
        return null;
    }
	
}
