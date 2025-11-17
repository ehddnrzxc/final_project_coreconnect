// 라이브러리 import
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // SockJS 웹소켓 클라이언트 라이브러리
import { Client } from "@stomp/stompjs";                // STOMP 프로토콜 클라이언트 라이브러리

// ========================================================================
// [중요] 쿠키에서 access_token을 꺼내서 WebSocket 연결 시 쿼리 파라미터로 전달
//    -> 반드시 상대경로 (/ws/chat)로 ENDPOINT 지정!!
// ========================================================================

// access_token을 브라우저 쿠키에서 읽어오는 함수
function getAccessTokenFromCookie() {
  console.log("document.cookie =", document.cookie);         // 여기!
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  console.log("match =", match);                             // 여기!
  return match ? decodeURIComponent(match[1]) : null;
}


const accessToken = getAccessTokenFromCookie(); // 쿠키에서 access_token 값 추출

// ENDPOINT를 상대경로로 지정! Vite dev-server가 프록시 처리할 것임
const ENDPOINT = `/ws/chat?accessToken=${accessToken}`;

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
    // SockJS 객체를 accessToken 쿼리파라미터가 포함된 상대 ENDPOINT로 생성 ★핵심
    webSocketFactory: () => new SockJS(ENDPOINT),
    debug: () => {},                              // 디버그 로깅 (필요시 사용)
    reconnectDelay: 5000,                         // 자동 재연결(ms)
    onConnect: () => {                            // 연결 성공 콜백
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
      onError && onError(frame);
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
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/chat.sendMessage",        // 서버 @MessageMapping 대상
      body: JSON.stringify({ roomId, content, fileYn, fileUrl }), // 메시지 본문
    });
  }
}