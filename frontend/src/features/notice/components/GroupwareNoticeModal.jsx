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
  Chip,
  Button,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ListIcon from "@mui/icons-material/List";

import {
  getAllNoticesList,
  getNoticesByCategoryList,
  getNoticeDetail,
} from "../api/noticeAPI";

const CATEGORY_LABELS = {
  ALL: "전체",
  SYSTEM_NOTICE: "시스템 안내",
  SERVICE_INFO: "서비스 정보",
  UPDATE: "업데이트",
};

export default function GroupwareNoticeModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // 모달 열릴 때 전체 목록 로드
  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setDetail(null);
      setSelectedCategory("ALL");
      setNotices([]);
      return;
    }

    // 초기에는 "전체" 카테고리 선택
    const loadAllNotices = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedCategory("ALL");
        setSelectedId(null);
        setDetail(null);
        const data = await getAllNoticesList();
        setNotices(data);
      } catch (e) {
        console.error(e);
        setError("공지사항을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadAllNotices();
  }, [open]);

  // 카테고리 선택 시 해당 카테고리의 공지사항 로드
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      setError("");
      setSelectedCategory(category);
      setSelectedId(null);
      setDetail(null);
      
      let data;
      if (category === "ALL") {
        data = await getAllNoticesList();
      } else {
        data = await getNoticesByCategoryList(category);
      }
      setNotices(data);
    } catch (e) {
      console.error(e);
      setError("공지사항을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 공지사항 클릭 시 상세보기
  const handleClickNoticeItem = async (id) => {
    try {
      setLoading(true);
      setError("");
      const data = await getNoticeDetail(id);
      setDetail(data);
      setSelectedId(id);
    } catch (e) {
      console.error(e);
      setError("공지 내용을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleClose = () => {
    setSelectedId(null);
    setDetail(null);
    setSelectedCategory("ALL");
    setNotices([]);
    onClose();
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: "80vh",
          maxHeight: "800px",
        },
      }}
    >
      <Box sx={{ display: "flex", height: "100%" }}>
        {/* 좌측 사이드바 */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              공지사항
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <List sx={{ py: 1 }}>
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                <ListItemButton
                  key={category}
                  selected={selectedCategory === category}
                  onClick={() => handleCategorySelect(category)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                      "&:hover": {
                        bgcolor: "action.selected",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: selectedCategory === category ? 600 : 400,
                        }}
                      >
                        {label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Paper>

        {/* 우측 콘텐츠 영역 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 목록 화면 */}
          {!selectedId && (
            <>
              <DialogTitle
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {CATEGORY_LABELS[selectedCategory]}
                </Typography>
                <IconButton size="small" onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent
                dividers
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 0,
                }}
              >
                {loading && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                    }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                )}

                {error && (
                  <Box sx={{ p: 3 }}>
                    <Typography color="error" variant="body2">
                      {error}
                    </Typography>
                  </Box>
                )}

                {!loading && !error && notices.length === 0 && (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      등록된 공지사항이 없습니다.
                    </Typography>
                  </Box>
                )}

                {!loading && !error && notices.length > 0 && (
                  <List sx={{ py: 0 }}>
                    {notices.map((notice) => (
                      <ListItemButton
                        key={notice.id}
                        onClick={() => handleClickNoticeItem(notice.id)}
                        sx={{
                          py: 2,
                          px: 3,
                          borderBottom: 1,
                          borderColor: "divider",
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                          <Chip
                            label={notice.categoryLabel || notice.category}
                            size="small"
                            sx={{
                              minWidth: 80,
                              bgcolor: "grey.300",
                              color: "grey.700",
                              "& .MuiChip-label": {
                                color: "grey.700",
                              },
                            }}
                          />
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  mb: 0.5,
                                }}
                              >
                                {notice.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(notice.createdAt)}
                              </Typography>
                            }
                            sx={{ flex: 1 }}
                          />
                        </Box>
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
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 2,
                }}
              >
                <IconButton size="small" onClick={handleBackToList}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{ fontWeight: 600, flex: 1 }}
                >
                  {detail.title}
                </Typography>
                <IconButton size="small" onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent
                dividers
                sx={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Chip
                      label={detail.categoryLabel || detail.category}
                      size="small"
                      sx={{
                        bgcolor: "grey.300",
                        color: "grey.700",
                        "& .MuiChip-label": {
                          color: "grey.700",
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      게시일 {formatDateTime(detail.createdAt)}
                    </Typography>
                    {detail.updatedAt &&
                      detail.updatedAt !== detail.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          | 최종 업데이트 {formatDateTime(detail.updatedAt)}
                        </Typography>
                      )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "text.primary",
                  }}
                >
                  {detail.content}
                </Typography>

                <Box
                  sx={{
                    mt: 4,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<ListIcon />}
                    onClick={handleBackToList}
                    sx={{
                      px: 4,
                    }}
                  >
                    목록
                  </Button>
                </Box>
              </DialogContent>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
