// singleton native WebSocket client for /ws/notification
// - connect({ baseUrl, onMessage })
// - disconnect()

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30s
const PING_INTERVAL = 20000; // 20s
let pingIntervalId = null;

/**
 * WebSocket URL 빌더 (더 이상 토큰 필요 없음!)
 */
function buildUrl(baseUrl) {
  // 현재는 쿼리스트링에 토큰을 넣지 않습니다.
  return baseUrl;
}

/**
 * WebSocket 연결 (access_token 관련 로직 제거, 오직 연결만!)
 */
export function connectNotification({ baseUrl = "ws://localhost:8080/ws/notification", onMessage }) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // accessToken 체크 및 강제 분기 제거! 무조건 연결만 시도
  const url = buildUrl(baseUrl);
  console.log("url: " + url);
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("[Notification WS] connected:", url);
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // start ping to keep connection alive if server expects it
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

  socket.onclose = (evt) => {
    console.log("[Notification WS] closed", evt.code, evt.reason);
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
    }
    socket = null;
    // reconnect: 항상 재접속 시도 (access_token 체크 없음)
    attemptReconnect({ baseUrl, onMessage });
  };

  socket.onerror = (err) => {
    console.error("[Notification WS] error", err);
    // 오류 발생 시 close 핸들러에서 재연결 시도하도록 놔둠
  };

  return socket;
}

function attemptReconnect({ baseUrl, onMessage }) {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`[Notification WS] reconnecting in ${Math.floor(delay)}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    connectNotification({ baseUrl, onMessage });
  }, delay);
}

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

// 쿠키에서 값 꺼내는 유틸 함수 (남겨둠: 필요시 참고용)
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}