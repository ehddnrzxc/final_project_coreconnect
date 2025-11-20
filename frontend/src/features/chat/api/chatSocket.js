// 라이브러리 import
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // SockJS 웹소켓 클라이언트 라이브러리
import { Client } from "@stomp/stompjs";                // STOMP 프로토콜 클라이언트 라이브러리

// ========================================================================
// [중요] HttpOnly 쿠키로 설정된 access_token은 JavaScript에서 읽을 수 없습니다.
//    -> SockJS가 자동으로 쿠키를 전송하므로 쿼리 파라미터 없이 연결합니다.
//    -> 백엔드 WebSocketAuthInterceptor가 쿠키에서 자동으로 토큰을 읽습니다.
//    -> 반드시 상대경로 (/ws/chat)로 ENDPOINT 지정!!
// ========================================================================

// ENDPOINT를 상대경로로 지정! Vite dev-server가 프록시 처리할 것임
// 쿠키는 SockJS가 자동으로 전송하므로 쿼리 파라미터 불필요
const ENDPOINT = `/ws/chat`;

// STOMP 클라이언트 및 구독(Subscription) 전역 변수
let stompClient = null;      // STOMP 클라이언트 인스턴스
let subscription = null;     // 현재 방 구독(subscription)을 저장

/**
 * 채팅방에 STOMP로 연결 및 구독을 수행하는 함수
 * @param {number|string} roomId - 채팅방 ID
 * @param {function} onMessage - 메시지 수신 콜백
 * @param {function} onConnect - 연결 성공 콜백
 * @param {function} onError - 에러 콜백
 */
export function connectStomp(roomId, onMessage, onConnect, onError) {
  console.log('🔥 [ChatSocket] connectStomp 호출:', { roomId });
  
  // 기존 커넥션이 남아 있다면 안전하게 해제 (중복 연결 방지)
  if (stompClient) {
    console.log('🔥 [ChatSocket] 기존 연결 해제 중...');
    stompClient.deactivate();
  }

  console.log('🔥 [ChatSocket] 새로운 STOMP 클라이언트 생성 중...');
  stompClient = new Client({
    // SockJS 객체를 상대 ENDPOINT로 생성
    // 쿠키는 자동으로 전송되므로 쿼리 파라미터 불필요
    webSocketFactory: () => {
      console.log('[ChatSocket] 연결 시도:', ENDPOINT);
      const sock = new SockJS(ENDPOINT);
      sock.onopen = () => {
        console.log('[SockJS] 연결 열림');
      };
      sock.onclose = (event) => {
        console.log('[SockJS] 연결 닫힘', event);
        onError && onError(event);
      };
      sock.onerror = (error) => {
        console.error('[SockJS] 에러:', error);
        onError && onError(error);
      };
      return sock;
    },
    debug: (str) => {
      console.log('[STOMP Debug]', str);
      // ⭐ SEND 메시지 전송 시 상세 로그
      if (str && str.includes('>>> SEND')) {
        console.log('🔥 [ChatSocket] STOMP SEND 명령 실행됨:', str);
      }
      // ⭐ 에러 발생 시 로그
      if (str && (str.includes('ERROR') || str.includes('error') || str.includes('Error'))) {
        console.error('🔥 [ChatSocket] STOMP 에러 발생:', str);
      }
    },
    reconnectDelay: 5000,                         // 자동 재연결(ms)
    onConnect: () => {                            // 연결 성공 콜백
      console.log('🔥 [ChatSocket] [STOMP] 연결 성공 - roomId:', roomId);
      // 기존 구독 해제 (이중 수신 방지)
      if (subscription) {
        console.log('🔥 [ChatSocket] 기존 구독 해제');
        subscription.unsubscribe();
      }
      // /topic/chat.room.{roomId} 구독 (방의 메시지만 구독)
      const subscribeTimestamp = new Date().toISOString();
      console.log('🔥 [ChatSocket] ========== 새 구독 시작 ==========', {
        timestamp: subscribeTimestamp,
        topic: `/topic/chat.room.${roomId}`,
        roomId: roomId,
        기존구독존재여부: subscription != null
      });
      
      subscription = stompClient.subscribe(
        `/topic/chat.room.${roomId}`,
        (msg) => {
          const receiveTimestamp = new Date().toISOString();
          console.log(`🔥 [ChatSocket] ========== STOMP 메시지 수신 ==========`, {
            timestamp: receiveTimestamp,
            topic: `/topic/chat.room.${roomId}`,
            destination: msg.destination,
            body: msg.body,
            bodyLength: msg.body ? msg.body.length : 0,
            headers: msg.headers,
            subscriptionId: subscription?.id
          });
          try {
            const payload = JSON.parse(msg.body);  // 메시지 파싱
            console.log(`🔥 [ChatSocket] 메시지 파싱 성공:`, {
              timestamp: receiveTimestamp,
              id: payload.id,
              type: payload.type || "일반메시지",
              roomId: payload.roomId,
              senderName: payload.senderName,
              senderEmail: payload.senderEmail,
              messageContent: payload.messageContent,
              unreadCount: payload.unreadCount,
              chatId: payload.chatId, // UNREAD_COUNT_UPDATE용
              전체payload: payload,
              type값: payload.type,
              type타입: typeof payload.type,
              UNREAD_COUNT_UPDATE여부: payload.type === "UNREAD_COUNT_UPDATE"
            });
            
            // ⭐ UNREAD_COUNT_UPDATE 메시지 특별 로그
            if (payload.type === "UNREAD_COUNT_UPDATE") {
              console.log("📊 [ChatSocket] ⭐⭐⭐ UNREAD_COUNT_UPDATE 메시지 수신! ⭐⭐⭐", {
                timestamp: receiveTimestamp,
                chatId: payload.chatId,
                unreadCount: payload.unreadCount,
                roomId: payload.roomId,
                전체payload: payload
              });
            }
            console.log(`🔥 [ChatSocket] onMessage 콜백 호출 전:`, {
              timestamp: receiveTimestamp,
              onMessage존재여부: onMessage != null
            });
            if (onMessage) {
              onMessage(payload);       // 파싱 성공시 콜백
              console.log(`🔥 [ChatSocket] onMessage 콜백 호출 완료:`, {
                timestamp: receiveTimestamp,
                messageId: payload.id,
                messageType: payload.type || "일반메시지"
              });
            } else {
              console.error(`🔥 [ChatSocket] onMessage 콜백이 없습니다!`);
            }
          } catch (e) {
            console.error(`🔥 [ChatSocket] 메시지 파싱 실패:`, {
              error: e.message,
              stack: e.stack,
              body: msg.body
            });
            onMessage && onMessage({ raw: msg.body }); // 파싱 실패시 원본전달
          }
        }
      );
      console.log('🔥 [ChatSocket] 구독 완료, onConnect 콜백 호출');
      if (onConnect) onConnect();                 // 연결 성공 후처리 콜백
    },
    onStompError: (frame) => {                    // STOMP 프로토콜 에러 콜백
      console.error('🔥 [ChatSocket] [STOMP Error]', {
        command: frame?.command,
        headers: frame?.headers,
        body: frame?.body,
        전체frame: frame
      });
      onError && onError(frame);
    },
    onWebSocketError: (event) => {                // WebSocket 레벨 에러 콜백
      console.error('🔥 [ChatSocket] [WebSocket Error]', {
        type: event?.type,
        target: event?.target,
        전체event: event
      });
      onError && onError(event);
    },
    onDisconnect: (frame) => {                    // 연결 해제 콜백
      console.warn('🔥 [ChatSocket] [STOMP Disconnect]', {
        command: frame?.command,
        headers: frame?.headers,
        body: frame?.body
      });
    }
    // 주의: STOMP 프로토콜 헤더로 인증 불가, 쿼리파라미터/쿠키 방식만 가능
  });
  console.log('🔥 [ChatSocket] STOMP 클라이언트 activate 호출');
  stompClient.activate(); // 커넥션 개시
  console.log('🔥 [ChatSocket] connectStomp 완료 - stompClient:', stompClient ? '생성됨' : 'null');
}

/**
 * 현재 연결 및 구독을 해제하는 함수
 */
export function disconnectStomp() {
  console.log('🔥 [ChatSocket] disconnectStomp 호출');
  try {
    if (subscription) {
      console.log('🔥 [ChatSocket] 구독 해제');
      subscription.unsubscribe(); // 구독 해제
    }
    if (stompClient) {
      console.log('🔥 [ChatSocket] STOMP 클라이언트 연결 해제');
      stompClient.deactivate();    // STOMP 클라이언트 연결 해제
    }
  } catch (e) {
    console.error('🔥 [ChatSocket] disconnectStomp 예외:', e);
  }
  console.log('🔥 [ChatSocket] disconnectStomp 완료 - stompClient를 null로 설정');
  stompClient = null;
  subscription = null;
}

/**
 * 현재 방에 STOMP로 메시지를 전송하는 함수
 * @param {object} param0
 * @param {number|string} param0.roomId - 방 ID
 * @param {string} param0.content - 텍스트 메시지 내용
 * @param {boolean} param0.fileYn - 파일 포함 여부 (기본 false)
 * @param {string|null} param0.fileUrl - 파일 URL (기본 null)
 */
/**
 * STOMP 클라이언트 연결 상태 확인 및 재연결 시도
 * @returns {Promise<boolean>} 연결 성공 여부
 */
function ensureConnected(roomId, onMessage, onConnect, onError) {
  return new Promise((resolve) => {
    if (!stompClient || !stompClient.connected) {
      console.warn('🔥 [ChatSocket] STOMP 클라이언트가 연결되지 않았습니다. 재연결 시도...');
      
      // 재연결 성공 시 resolve
      const originalOnConnect = onConnect;
      const wrappedOnConnect = () => {
        if (originalOnConnect) originalOnConnect();
        // 연결 완료 후 약간의 지연을 두고 resolve
        setTimeout(() => {
          resolve(stompClient && stompClient.connected);
        }, 100);
      };
      
      connectStomp(roomId, onMessage, wrappedOnConnect, onError);
    } else {
      resolve(true);
    }
  });
}

/**
 * 연결이 완료될 때까지 대기하는 헬퍼 함수
 */
function waitForConnection(maxWait = 5000) {
  return new Promise((resolve) => {
    if (stompClient && stompClient.connected) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (stompClient && stompClient.connected) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

export function sendStompMessage({ roomId, content, fileYn = false, fileUrl = null }, reconnectCallbacks = null) {
  console.log('🔥 [ChatSocket] sendStompMessage 호출:', { roomId, content, fileYn, fileUrl });
  
  // ⭐ 연결 상태 확인 및 재연결 시도
  const sendMessageInternal = async () => {
    if (!stompClient) {
      console.error('🔥 [ChatSocket] STOMP 클라이언트가 초기화되지 않았습니다.');
      if (reconnectCallbacks) {
        console.log('🔥 [ChatSocket] 재연결 시도...');
        const connected = await ensureConnected(roomId, reconnectCallbacks.onMessage, reconnectCallbacks.onConnect, reconnectCallbacks.onError);
        if (!connected) {
          console.error('🔥 [ChatSocket] 재연결 실패');
          return false;
        }
        // 재연결 후 연결 완료 대기
        const ready = await waitForConnection();
        if (!ready) {
          console.error('🔥 [ChatSocket] 연결 완료 대기 시간 초과');
          return false;
        }
      } else {
        return false;
      }
    }
    
    console.log('🔥 [ChatSocket] STOMP 클라이언트 상태:', {
      connected: stompClient.connected,
      active: stompClient.active,
      clientId: stompClient.clientId
    });
    
    if (!stompClient.connected) {
      console.error('🔥 [ChatSocket] STOMP 연결이 되어 있지 않습니다. 연결 상태:', {
        connected: stompClient.connected,
        active: stompClient.active,
        subscription: subscription ? '있음' : '없음'
      });
      
      // 재연결 시도
      if (reconnectCallbacks) {
        console.log('🔥 [ChatSocket] 재연결 시도...');
        const connected = await ensureConnected(roomId, reconnectCallbacks.onMessage, reconnectCallbacks.onConnect, reconnectCallbacks.onError);
        if (!connected) {
          console.error('🔥 [ChatSocket] 재연결 실패');
          return false;
        }
        // 재연결 후 연결 완료 대기
        const ready = await waitForConnection();
        if (!ready) {
          console.error('🔥 [ChatSocket] 연결 완료 대기 시간 초과');
          return false;
        }
      } else {
        return false;
      }
    }

    try {
      const messageBody = JSON.stringify({ roomId, content, fileYn, fileUrl });
      console.log('🔥 [ChatSocket] 메시지 전송 시작:', { 
        destination: "/app/chat.sendMessage", 
        body: messageBody,
        bodyLength: messageBody.length
      });
      
      // ⭐ STOMP 클라이언트 상태 재확인
      if (!stompClient.connected) {
        console.error('🔥 [ChatSocket] publish 호출 전 연결 상태 재확인 실패 - connected: false');
        return false;
      }
      
      console.log('🔥 [ChatSocket] publish 호출 직전 - 연결 상태:', {
        connected: stompClient.connected,
        active: stompClient.active
      });
      
      stompClient.publish({
        destination: "/app/chat.sendMessage",        // 서버 @MessageMapping 대상
        body: messageBody, // 메시지 본문
      });
      
      console.log('🔥 [ChatSocket] publish 호출 직후');
      console.log('🔥 [ChatSocket] 메시지 전송 완료 (publish 호출됨)');
      return true;
    } catch (error) {
      console.error('🔥 [ChatSocket] 메시지 전송 실패:', {
        error: error.message,
        stack: error.stack,
        roomId,
        content
      });
      return false;
    }
  };
  
  // ⭐ 비동기 함수 호출 (프론트엔드에서 await 사용 가능하도록)
  return sendMessageInternal();
}