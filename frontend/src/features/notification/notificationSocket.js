// singleton native WebSocket client for /ws/notification
// - connect({ baseUrl, onMessage })  // ⚠️ accessToken은 이제 쿠키에서 자동으로 읽어옴!
/*
  이 코드는 native WebSocket 방식입니다.
  서버(WebSocketAuthInterceptor)가 JWT accessToken을 요구하므로
  반드시 쿼리스트링에 accessToken 파라미터를 붙여서 연결해야 정상동작합니다.
  이제 accessToken 파라미터는 직접 주지 않아도, 내부에서 쿠키에서 자동으로 읽어서 붙입니다!
  ⚠️ 'baseUrl'을 개발(로컬)·운영(클라우드)에서 모두 쓸 수 있게 환경에 따라 동적으로 지정하는 게 BEST!
  => 아래 코드에서 자동분기 기능 추가됨!
*/

let socket = null; // 현재 WebSocket 인스턴스
let reconnectTimer = null; // 재접속용 타이머 핸들러
let reconnectAttempts = 0; // 재접속 횟수 카운트
const MAX_RECONNECT_DELAY = 30000; // 30초보다 더 늦게 재접속 안함
const PING_INTERVAL = 20000; // 서버 연속연결 유지를 위한 ping 주기(20초)
let pingIntervalId = null; // ping 인터벌 핸들러

/**
 * getCookie
 * - name에 해당하는 쿠키를 브라우저 쿠키에서 꺼내서 값을 반환
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * WebSocket URL 빌더
 * - 쿠키에서 accessToken을 읽어와서 쿼리스트링으로 붙임
 */
function buildUrl(baseUrl) {
  const accessToken = getCookie("access_token");
  if (!accessToken) {
    throw new Error('[NotificationSocket] access_token 쿠키 누락: JWT 토큰이 반드시 필요함!');
  }
  const hasQuery = baseUrl.includes('?');
  return `${baseUrl}${hasQuery ? '&' : '?'}accessToken=${encodeURIComponent(accessToken)}`;
}

/**
 * 환경에 따라 기본 WS 주소를 자동으로 결정 (수정된 부분)
 * - Vite 사용시 import.meta.env.MODE와 import.meta.env.VITE_WS_URL_DEV/PROD 환경변수 사용 권장
 * - 환경변수 없이 window.location 기반으로 분기하는 패턴 지원
 */
function getDefaultWsUrl() {
  // Vite/CRA 환경 변수 우선 적용 (권장)
  // Vite: import.meta.env.MODE, import.meta.env.VITE_WS_URL_DEV 등
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.MODE === "development" && import.meta.env.VITE_WS_URL_DEV)
      return import.meta.env.VITE_WS_URL_DEV;
    if (import.meta.env.MODE === "production" && import.meta.env.VITE_WS_URL_PROD)
      return import.meta.env.VITE_WS_URL_PROD;
  }
  // 만약 환경변수 없는 경우 window.location 기준 분기
  const hostname = (typeof window !== "undefined" && window.location.hostname) ? window.location.hostname : "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // 로컬 개발 환경
    return "ws://localhost:8080/ws/notification";
  }
  // 운영 혹은 기타(변경할 실제 WS URL 입력)
  return "ws://13.125.225.211:8080/ws/notification";
}

/**
 * connectNotification
 * - Notification WebSocket 연결을 생성 및 관리
 * - baseUrl 파라미터를 명시적으로 주지 않으면 환경에 따라 자동 결정(getDefaultWsUrl 이용)
 *   → 개발/운영 동시 대응
 * - onMessage: 메시지 수신시 콜백
 *
 * ▶️ [수정 포인트] ◀️
 * - 내부에서 getDefaultWsUrl()로 기본값 설정
 * - override 하고 싶으면 baseUrl 직접 넘기기
 */
export function connectNotification({
  baseUrl = getDefaultWsUrl(), // <-- 이 부분이 환경에 따라 자동 결정(수정 부분)
  onMessage
}) {
  // access_token 가져와서 URL 생성
  let url;
  try {
    url = buildUrl(baseUrl); // 내부에서 쿠키에서 access_token 읽어옴
  } catch (err) {
    console.error(err.message);
    return null;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket; // 이미 연결된 경우 바로 반환
  }

  console.log("url: " + url);
  socket = new WebSocket(url);

  // 연결 성공시
  socket.onopen = () => {
    console.log("[Notification WS] connected:", url);
    reconnectAttempts = 0; // 시도횟수 리셋
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // 주기적으로 ping 메세지 전송(서버 idle disconnect 방지)
    if (!pingIntervalId) {
      pingIntervalId = setInterval(() => {
        try {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "PING", ts: Date.now() }));
          }
        } catch (e) {
          // ignore
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
    attemptReconnect({ baseUrl, onMessage }); // accessToken은 내부에서 자동으로 계속 쿠키에서 읽음
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
function attemptReconnect({ baseUrl, onMessage }) {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`[Notification WS] reconnecting in ${Math.floor(delay)}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    connectNotification({ baseUrl, onMessage });
  }, delay);
}

/**
 * disconnectNotification
 * - 소켓 연결 해제 및 리소스, 타이머 정리
 */
export function disconnectNotification() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
  if (socket) {
    try {
      socket.close();
    } catch (e) {}
    socket = null;
  }
}

/*
변경 사항 요약
---------------
- getDefaultWsUrl() 함수에서 환경변수(import.meta.env 등) 또는 window.location.hostname에 따라 기본 ws 주소 자동 분기 (수정 포인트)
- connectNotification의 baseUrl 파라미터는 값이 없으면 환경에 맞게 자동 결정됨
- accessToken 파라미터는 getCookie("access_token")로 항상 쿠키에서 읽어서 쿼리스트링에 붙인다.
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