// singleton native WebSocket client for /ws/notification
// - connect({ baseUrl, onMessage })  // ⚠️ accessToken은 이제 쿠키에서 자동으로 읽어옴!
/*
  이 코드는 native WebSocket 방식이지만,
  서버(WebSocketAuthInterceptor)가 JWT accessToken을 요구함!
  반드시 쿼리스트링에 accessToken 파라미터를 붙여서 연결해야 실제 WS 연결이 동작.
  ★ 이제 accessToken 파라미터를 직접 주지 않아도, 내부에서 쿠키에서 자동으로 읽어서 사용합니다!
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
  // Application > Cookies > http://localhost:5173 화면에서 이름이 access_token인 값 읽기
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * WebSocket URL 빌더
 * - 쿠키에서 accessToken을 읽어와서 쿼리스트링으로 붙임
 * - baseUrl: ws://localhost:8080/ws/notification
 */
function buildUrl(baseUrl) {
  // access_token을 쿠키에서 읽는다
  const accessToken = getCookie("access_token"); // ★ 변경: accessToken을 쿠키에서 자동 읽기!
  if (!accessToken) {
    throw new Error('[NotificationSocket] access_token 쿠키 누락: JWT 토큰이 반드시 필요함!');
  }
  // 이미 쿼리있는 경우 지원(안전하게)
  const hasQuery = baseUrl.includes('?');
  return `${baseUrl}${hasQuery ? '&' : '?'}accessToken=${encodeURIComponent(accessToken)}`;
}

/**
 * connectNotification
 * - Notification WebSocket 연결을 생성 및 관리
 * - (변경사항) accessToken을 명시적으로 인자로 받지 않고, 쿠키에서 자동으로 읽어옴
 * @param {object} param
 *   - baseUrl: 기본 ws 주소 (생략시 기본값 사용)
 *   - onMessage: 메시지 도착시 콜백
 */
export function connectNotification({ baseUrl = "ws://localhost:8080/ws/notification", onMessage }) {
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
- 기존 connectNotification 사용시 accessToken 파라미터를 별도 전달해야 했으나,
  이제 내부적으로 getCookie("access_token")을 통해 쿠키에서 읽어온 JWT 토큰을 사용합니다.
- buildUrl 내에서 access_token 값을 쿠키에서 가져와 쿼리스트링으로 자동 추가
  (프론트 사용자는 connectNotification({ onMessage })로만 호출하면 됩니다!)
- 쿠키가 없거나 access_token이 없다면, 에러 메시지를 콘솔에 출력하고 연결을 하지 않음(서버 handshake 거부 방지)
- 재연결 역시 access_token 쿠키에서 자동으로 읽어오므로, 별도 신경 쓸 필요 없음

사용 예시:
-----------
import { connectNotification, disconnectNotification } from './notificationSocket';

connectNotification({
  onMessage: (msg) => {
    console.log(msg);
  }
});
*/