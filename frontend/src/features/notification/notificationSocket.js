// singleton native WebSocket client for /ws/notification
// - connect({ baseUrl, token, onMessage })
// - disconnect()
let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30s
const PING_INTERVAL = 20000; // 20s
let pingIntervalId = null;

function buildUrl(baseUrl, token) {
  // baseUrl 예: ws://localhost:8080/ws/notification
  if (!token) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}accessToken=${encodeURIComponent(token)}`;
}

export function connectNotification({ baseUrl = "ws://localhost:8080/ws/notification", token, onMessage }) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  const url = buildUrl(baseUrl, token);
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
    // reconnect
    attemptReconnect({ baseUrl, token, onMessage });
  };

  socket.onerror = (err) => {
    console.error("[Notification WS] error", err);
    // 오류 발생 시 close핸들러에서 재연결 시도하도록 놔둠
  };

  return socket;
}

function attemptReconnect({ baseUrl, token, onMessage }) {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`[Notification WS] reconnecting in ${Math.floor(delay)}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    connectNotification({ baseUrl, token, onMessage });
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