import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connectNotification, disconnectNotification } from "./notificationSocket";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const RealtimeNotificationContext = createContext({
  notifications: [],
  pushNotification: () => {},
  clearNotifications: () => {},
});

export const useRealtimeNotifications = () => useContext(RealtimeNotificationContext);




/**
 * 사용법:
 * - main.jsx 에서 앱 루트를 감싸세요:
 *   <RealtimeNotificationProvider baseUrl={import.meta.env.VITE_WS_NOTIFICATION || "ws://localhost:8080/ws/notification"}>...</RealtimeNotificationProvider>
 */
export function RealtimeNotificationProvider({ children, baseUrl }) {
  const [notifications, setNotifications] = useState([]);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackPayload, setSnackPayload] = useState(null);

  const pushNotification = useCallback((payload) => {
    setNotifications(prev => [payload, ...prev].slice(0, 100));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const typeToSeverity = (type) => {
    switch ((type || "").toUpperCase()) {
      case "NOTICE": return "info";
      case "SCHEDULE": return "success";
      case "APPROVAL": return "warning";
      case "EMAIL": return "info";
      default: return "info";
    }
  };

  
useEffect(() => {
  console.log("[DEBUG] RealtimeNotificationProvider useEffect 실행됨");
  // 이하 생략
}, [pushNotification, baseUrl]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    // Vite 환경에서는 import.meta.env 사용!
    const url = baseUrl || import.meta.env.VITE_WS_NOTIFICATION || "ws://localhost:8080/ws/notification";

    const handleMessage = (payload) => {
      console.log("[Notification WS] message payload ::", payload); 
      const notif = {
        id: payload.notificationId || payload.id || `${Date.now()}`,
        type: payload.notificationType || payload.type || "NOTICE",
        message: payload.message || payload.body || (payload.raw ? String(payload.raw) : ""),
        senderName: payload.senderName || payload.sender || "",
        createdAt: payload.createdAt || new Date().toISOString(),
        raw: payload
      };
      pushNotification(notif);
      setSnackPayload(notif);
      setSnackOpen(true);
    };

    connectNotification({ baseUrl: url, token, onMessage: handleMessage });
    return () => {
      disconnectNotification();
    };
  }, [pushNotification, baseUrl]);

  return (
    <RealtimeNotificationContext.Provider value={{ notifications, pushNotification, clearNotifications }}>
      {children}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setSnackOpen(false)}
      >
        {snackPayload ? (
          <Alert onClose={() => setSnackOpen(false)} severity={typeToSeverity(snackPayload.type)} sx={{ width: "100%" }} variant="filled">
            <strong>{snackPayload.senderName ? `${snackPayload.senderName} — ` : ""}</strong>
            {snackPayload.message}
          </Alert>
        ) : null}
      </Snackbar>
    </RealtimeNotificationContext.Provider>
  );
}

export default RealtimeNotificationProvider;