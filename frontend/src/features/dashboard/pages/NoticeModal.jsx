import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  getDashboardNotices,
  getDashboardNoticeDetail,
} from "../api/dashboardAPI";

export default function NoticeModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);

  // 모달 열릴 때 공지 목록 로드
  useEffect(() => {
    if (!open) return;

    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardNotices(5);
        setNotices(data);
      } catch (e) {
        console.error(e);
        setError("공지사항을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [open]);

  const handleClickNoticeItem = async (id) => {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardNoticeDetail(id);
      console.log("detail: ", data);
      setDetail(data);
      setSelectedId(id);
    } catch (e) {
      console.error(e);
      setError("공지 내용을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleClose = () => {
    setSelectedId(null);
    setDetail(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      {/* 목록 화면 */}
      {!selectedId && (
        <>
          <DialogTitle>공지사항</DialogTitle>
          <DialogContent dividers>
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            {!loading && !error && notices.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                등록된 공지사항이 없습니다.
              </Typography>
            )}

            {!loading && !error && notices.length > 0 && (
              <List>
                {notices.map((n) => (
                  <ListItemButton
                    key={n.id}
                    onClick={() => handleClickNoticeItem(n.id)}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: n.pinned ? 700 : 500,
                            mb: 0.3,
                          }}
                        >
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {n.writerName} ·{" "}
                          {new Date(n.createdAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </DialogContent>
        </>
      )}

      {/* 상세 화면 */}
      {selectedId && detail && (
        <>
          <DialogTitle
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <IconButton size="small" onClick={handleBack}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
              {detail.title}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1.5, display: "block" }}
            >
              {detail.writerName} ·{" "}
              {new Date(detail.createdAt).toLocaleString()}
            </Typography>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {detail.content}
            </Typography>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
