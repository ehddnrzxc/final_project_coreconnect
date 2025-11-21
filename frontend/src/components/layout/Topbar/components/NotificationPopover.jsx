import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Divider,
  List,
  ListItem,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatTime } from "../../../../utils/TimeUtils";
import { getNotificationTypeLabel } from "../../../../utils/labelUtils";
import {
  getUnreadNotificationSummary,
  getUnreadNotificationsExceptLatest,
  markNotificationAsRead,
} from "../../../../features/notification/api/notificationAPI";

export default function NotificationPopover({
  anchorEl,
  open,
  onClose,
}) {
  const [unreadList, setUnreadList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const summary = await getUnreadNotificationSummary();

      // 모든 미읽은 알림을 최신순으로 가져오기
      const allUnreadNotifications = [];

      // 최근 알림이 있으면 리스트에 추가
      if (summary && summary.notificationId) {
        allUnreadNotifications.push({
          notificationId: summary.notificationId,
          message: summary.message,
          notificationType: summary.notificationType,
          sentAt: summary.sentAt,
          senderName: summary.senderName,
        });
      }

      // 나머지 알림 목록 추가
      if (summary && summary.unreadCount > 1) {
        const list = await getUnreadNotificationsExceptLatest();
        allUnreadNotifications.push(...list);
      }

      // sentAt 기준으로 최신순 정렬
      allUnreadNotifications.sort((a, b) => {
        const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return dateB - dateA; // 최신순
      });

      setUnreadList(allUnreadNotifications);
    } catch (err) {
      console.error("알림 조회 실패:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: 360,
          maxHeight: 500,
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            알림
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {loadingNotifications ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            불러오는 중...
          </Typography>
        ) : unreadList.length > 0 ? (
          <List dense sx={{ maxHeight: 400, overflowY: "auto" }}>
            {unreadList.map((notif) => (
              <ListItem
                key={notif.notificationId}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => handleMarkAsRead(notif.notificationId)}
              >
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Chip
                      label={getNotificationTypeLabel(notif.notificationType)}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {notif.sentAt ? formatTime(notif.sentAt) : ""}
                    </Typography>
                  </Box>
                  {notif.senderName && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {notif.senderName}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {notif.message || ""}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 3 }}
          >
            알림이 없습니다.
          </Typography>
        )}
      </Box>
    </Popover>
  );
}

