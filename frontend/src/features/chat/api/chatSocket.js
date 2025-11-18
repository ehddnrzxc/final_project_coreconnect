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
  // 기존 커넥션이 남아 있다면 안전하게 해제 (중복 연결 방지)
  if (stompClient) stompClient.deactivate();

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
    },
    reconnectDelay: 5000,                         // 자동 재연결(ms)
    onConnect: () => {                            // 연결 성공 콜백
      console.log('[STOMP] 연결 성공');
      // 기존 구독 해제 (이중 수신 방지)
      if (subscription) subscription.unsubscribe();
      // /topic/chat.room.{roomId} 구독 (방의 메시지만 구독)
      subscription = stompClient.subscribe(
        `/topic/chat.room.${roomId}`,
        (msg) => {
          try {
            const payload = JSON.parse(msg.body);  // 메시지 파싱
            onMessage && onMessage(payload);       // 파싱 성공시 콜백
          } catch (e) {
            onMessage && onMessage({ raw: msg.body }); // 파싱 실패시 원본전달
          }
        }
      );
      if (onConnect) onConnect();                 // 연결 성공 후처리 콜백
    },
    onStompError: (frame) => {                    // STOMP 프로토콜 에러 콜백
      console.error('[STOMP Error]', frame);
      onError && onError(frame);
    },
    onWebSocketError: (event) => {                // WebSocket 레벨 에러 콜백
      console.error('[WebSocket Error]', event);
      onError && onError(event);
    }
    // 주의: STOMP 프로토콜 헤더로 인증 불가, 쿼리파라미터/쿠키 방식만 가능
  });
  stompClient.activate(); // 커넥션 개시
}

/**
 * 현재 연결 및 구독을 해제하는 함수
 */
export function disconnectStomp() {
  try {
    if (subscription) subscription.unsubscribe(); // 구독 해제
    if (stompClient) stompClient.deactivate();    // STOMP 클라이언트 연결 해제
  } catch (e) {}                                  // 예외 무시
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
export function sendStompMessage({ roomId, content, fileYn = false, fileUrl = null }) {
  if (!stompClient) {
    console.error('[ChatSocket] STOMP 클라이언트가 초기화되지 않았습니다.');
    return false;
  }
  
  if (!stompClient.connected) {
    console.error('[ChatSocket] STOMP 연결이 되어 있지 않습니다. 연결 상태:', stompClient.connected);
    return false;
  }

  try {
    const messageBody = JSON.stringify({ roomId, content, fileYn, fileUrl });
    console.log('[ChatSocket] 메시지 전송:', { destination: "/app/chat.sendMessage", body: messageBody });
    stompClient.publish({
      destination: "/app/chat.sendMessage",        // 서버 @MessageMapping 대상
      body: messageBody, // 메시지 본문
    });
    return true;
  } catch (error) {
    console.error('[ChatSocket] 메시지 전송 실패:', error);
    return false;
  }
}