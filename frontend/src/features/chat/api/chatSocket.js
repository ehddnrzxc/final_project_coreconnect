import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { Client } from "@stomp/stompjs"; // STOMP 프로토콜 기반 클라이언트

const ENDPOINT = "http://localhost:8080/ws/chat"; // STOMP 엔드포인트 주소
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
  if (stompClient) stompClient.deactivate(); // (기존 연결 해제 후) 재연결 방지

  stompClient = new Client({
    webSocketFactory: () => new SockJS(ENDPOINT), // SockJS로 웹소켓 객체 생성
    debug: () => {},                              // 디버그 로깅 (여기서는 미사용)
    reconnectDelay: 5000,                         // 자동 재연결 간격(ms)
    onConnect: () => {                            // 연결 성공 콜백
      if (subscription) subscription.unsubscribe(); // 기존 구독 해제
      subscription = stompClient.subscribe(
        `/topic/chat.room.${roomId}`,              // 방별 토픽 구독
        (msg) => {
          try {
            const payload = JSON.parse(msg.body);  // 메시지 파싱
            onMessage && onMessage(payload);       // 콜백으로 전달
          } catch (e) {
            onMessage && onMessage({ raw: msg.body }); // 파싱 실패 시 원본 전달
          }
        }
      );
      if (onConnect) onConnect();                 // 연결 성공 후 추가 동작
    },
    onStompError: (frame) => {                    // STOMP 프로토콜 레벨 에러
      onError && onError(frame);
    }
  });
  stompClient.activate(); // 커넥션 실제 개시
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