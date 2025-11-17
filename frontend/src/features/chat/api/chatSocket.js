// 라이브러리 import: SockJS(SockJS 프로토콜 지원 웹소켓 클라이언트 lib), STOMP(stomp.js)
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // SockJS 클라이언트 라이브러리
import { Client } from "@stomp/stompjs";                // STOMP 프로토콜 클라이언트 라이브러리

// ========================================================================
// [중요] 쿠키에서 access_token을 꺼내서 WebSocket 연결 시 쿼리 파라미터로 전달
// ========================================================================

// access_token을 브라우저 쿠키에서 읽어오는 함수
function getAccessTokenFromCookie() {
  // document.cookie 는 ex) "access_token=foo; refresh_token=bar; ..."
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const accessToken = getAccessTokenFromCookie(); // 쿠키에서 access_token 값 추출

// WebSocket handshake에서 쿼리 파라미터로 토큰 전달
// ex) http://localhost:8080/ws/chat?accessToken=abc123
const ENDPOINT = `http://localhost:8080/ws/chat?accessToken=${accessToken}`;

// STOMP 클라이언트 및 구독(Subscription) 전역 변수
let stompClient = null;      // STOMP 클라이언트 싱글턴 변수
let subscription = null;     // 현재 방 구독(subscription)을 저장

/**
 * 채팅방에 STOMP로 연결 및 구독을 수행하는 함수
 * @param {number|string} roomId - 채팅방 ID
 * @param {function} onMessage - 메시지 수신 시 호출하는 콜백
 * @param {function} onConnect - 연결 성공 시 호출하는 콜백
 * @param {function} onError - 에러 발생 시 호출하는 콜백
 */
export function connectStomp(roomId, onMessage, onConnect, onError) {
  // 기존 커넥션이 남아있다면 안전하게 해제(중복 방지)
  if (stompClient) stompClient.deactivate();

  stompClient = new Client({
    // SockJS 객체를 accessToken 쿼리파라미터가 포함된 ENDPOINT로 생성 ★수정포인트
    webSocketFactory: () => new SockJS(ENDPOINT),
    debug: () => {},                              // 디버그 로깅 (여기서는 미사용)
    reconnectDelay: 5000,                         // 자동 재연결 간격(ms)
    onConnect: () => {                            // 연결 성공 콜백
      // 기존 구독이 있으면 해제 (이중 수신 방지)
      if (subscription) subscription.unsubscribe();
      // /topic/chat.room.{roomId} 구독 (해당 방의 메시지만 듣기)
      subscription = stompClient.subscribe(
        `/topic/chat.room.${roomId}`,
        (msg) => {
          try {
            const payload = JSON.parse(msg.body);  // 메시지 파싱
            onMessage && onMessage(payload);       // 수신 콜백 실행
          } catch (e) {
            onMessage && onMessage({ raw: msg.body }); // 파싱 에러시 원본 전달
          }
        }
      );
      if (onConnect) onConnect();                 // 연결 성공시 후처리 콜백
    },
    onStompError: (frame) => {                    // STOMP 프로토콜 레벨 에러시 콜백
      onError && onError(frame);
    }
    // 주의: STOMP 프로토콜 커스텀 헤더로 인증 불가, 반드시 쿼리 또는 쿠키 사용!
  });
  stompClient.activate(); // 실질적 연결 개시
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
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/chat.sendMessage",        // 서버 @MessageMapping 대상
      body: JSON.stringify({ roomId, content, fileYn, fileUrl }), // 메시지 본문
    });
  }
}