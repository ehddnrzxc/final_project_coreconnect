// SockJS 기반 WebSocket client for /ws/notification
// - connect({ onMessage })  // ⚠️ accessToken은 HttpOnly 쿠키에서 자동으로 전송됨!
/*
  이 코드는 SockJS 방식입니다 (채팅과 동일).
  서버(WebSocketAuthInterceptor)가 JWT accessToken을 쿠키에서 우선적으로 확인합니다.
  HttpOnly 쿠키는 JavaScript에서 읽을 수 없지만, SockJS가 자동으로 쿠키를 전송합니다.
  반드시 상대경로 (/ws/notification)로 ENDPOINT 지정!!
*/

import SockJS from 'sockjs-client/dist/sockjs.min.js';

let socket = null; // 현재 SockJS 인스턴스
let reconnectTimer = null; // 재접속용 타이머 핸들러
let reconnectAttempts = 0; // 재접속 횟수 카운트
const MAX_RECONNECT_DELAY = 30000; // 30초보다 더 늦게 재접속 안함
const PING_INTERVAL = 20000; // 서버 연속연결 유지를 위한 ping 주기(20초)
let pingIntervalId = null; // ping 인터벌 핸들러

// ENDPOINT를 상대경로로 지정! Vite dev-server가 프록시 처리할 것임
// 쿠키는 SockJS가 자동으로 전송하므로 쿼리 파라미터 불필요
const ENDPOINT = `/ws/notification`;

/**
 * connectNotification
 * - Notification WebSocket 연결을 생성 및 관리 (SockJS 사용)
 * - onMessage: 메시지 수신시 콜백
 */
export function connectNotification({ onMessage }) {
  // SockJS readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
  if (socket && socket.readyState === 1) {
    return socket; // 이미 연결된 경우 바로 반환
  }

  console.log("[Notification WS] 연결 시도:", ENDPOINT);
  socket = new SockJS(ENDPOINT);

  // 연결 성공시
  socket.onopen = () => {
    console.log("[Notification WS] connected:", ENDPOINT);
    reconnectAttempts = 0; // 시도횟수 리셋
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // 주기적으로 ping 메세지 전송(서버 idle disconnect 방지)
    if (!pingIntervalId) {
      pingIntervalId = setInterval(() => {
        try {
          if (socket && socket.readyState === 1) { // 1 = OPEN
            socket.send(JSON.stringify({ type: "PING", ts: Date.now() }));
          }
        } catch (err) {
          console.warn("[Notification WS] ping 전송 실패:", err);
        }
      }, PING_INTERVAL);
    }
  };

  // 메시지 수신시
  socket.onmessage = (evt) => {
    try {
      const payload = JSON.parse(evt.data);
      onMessage && onMessage(payload);
    } catch (err) {
      console.warn("[Notification WS] message parse error:", err, evt.data);
      // fallback: pass raw
      onMessage && onMessage({ raw: evt.data });
    }
  };

  // 연결이 끊길 때 (닫힘/서버 거부 등)
  socket.onclose = (evt) => {
    console.log("[Notification WS] closed", evt.code, evt.reason);
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
    }
    socket = null;
    // 1006이면 대부분 인증 실패, 서버 handshake 거부(로그 참고)
    attemptReconnect({ onMessage });
  };

  // 에러 발생시
  socket.onerror = (err) => {
    console.error("[Notification WS] error", err);
    // 오류 발생 시 close 핸들러에서 재연결 시도하도록 놔둠
  };

  return socket;
}

/**
 * attemptReconnect
 * - 끊길 시(에러, 인증실패 포함) 재연결(점점 대기시간 늘림, max 30초)
 */
function attemptReconnect({ onMessage }) {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`[Notification WS] reconnecting in ${Math.floor(delay)}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    connectNotification({ onMessage });
  }, delay);
}

/**
 * disconnectNotification
 * - 소켓 연결 해제 및 리소스, 타이머 정리
 */
export function disconnectNotification() {
  // 재연결 타이머 정리 (먼저 정리하여 재연결 방지)
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // 재연결 시도 횟수 리셋 (재연결 방지)
  reconnectAttempts = 0;
  
  // Ping 인터벌 정리
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
  
  // 소켓 연결 해제
  if (socket) {
    const currentSocket = socket; // 참조 저장
    socket = null; // 먼저 null로 설정하여 재연결 방지
    
    try {
      // 이벤트 핸들러 제거 (에러 핸들러가 호출되지 않도록)
      currentSocket.onerror = null;
      currentSocket.onclose = null;
      currentSocket.onmessage = null;
      currentSocket.onopen = null;
      
      // SockJS readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
      // 이미 닫혀있지 않은 경우에만 close 호출
      if (currentSocket.readyState !== 3) { // 3 = CLOSED
        currentSocket.close();
      }
    } catch (err) {
      // 에러가 발생해도 무시하고 계속 진행
      // 이미 socket을 null로 설정했으므로 문제없음
      console.warn("[Notification WS] disconnect 중 오류 (무시):", err);
    }
  }
}

/*
변경 사항 요약
---------------
- getDefaultWsUrl() 함수에서 환경변수(import.meta.env 등) 또는 window.location.hostname에 따라 기본 ws 주소 자동 분기 (수정 포인트)
- connectNotification의 baseUrl 파라미터는 값이 없으면 환경에 맞게 자동 결정됨
- accessToken은 HttpOnly 쿠키에 저장되어 있으며, WebSocket 연결 시 브라우저가 자동으로 쿠키를 전송합니다.
- 백엔드 WebSocketAuthInterceptor가 쿠키를 우선적으로 확인하므로 쿼리 파라미터 없이 연결합니다.
- connectNotification 사용자는 { baseUrl: "원하는주소", onMessage } 형식 또는 baseUrl 없이(onMessage만) 호출 가능
- 자동 재연결, 핑 유지, 오류 콘솔 안내, 수신 메시지 콜백 등 동일하게 동작

사용 예시:
-----------
// 1. 개발 로컬에서 테스트 (localhost:8080)
connectNotification({
  baseUrl: "ws://localhost:8080/ws/notification",
  onMessage: (msg) => {
    console.log("Notification Received (dev):", msg);
  }
});
// 2. 운영 서버에서 테스트 (13.125.225.211:8080)
connectNotification({
  baseUrl: "ws://13.125.225.211:8080/ws/notification",
  onMessage: (msg) => {
    console.log("Notification Received (prod):", msg);
  }
});
// 3. baseUrl 생략 (자동 개발/운영 분기)
connectNotification({
  onMessage: (msg) => {
    console.log("Notification Received (auto):", msg);
  }
});
*/