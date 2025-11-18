import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";
import { fetchInbox } from "../../email/api/emailApi";
import useUserEmail from '../../email/hook/useUserEmail'; 

export default function MailListCard() {
  const navigate = useNavigate();
  const [recentMails, setRecentMails] = useState([]);
  const [mailLoading, setMailLoading] = useState(true);
  
  // Hook은 컴포넌트 최상위에서 호출해야 함
  const userEmail = useUserEmail(); 

  console.log("userEmail: ", userEmail);

  // 받은메일함 최근 메일 가져오기
  useEffect(() => {
    if (!userEmail) {
      setMailLoading(false);
      return;
    }
    
    (async () => {
      try {
        const res = await fetchInbox(userEmail, 0, 5, "all"); // 최근 5개만
        setRecentMails(res.data.data.content || []);
      } catch (err) {
        console.error("메일 목록 불러오기 실패:", err);
        setRecentMails([]);
      } finally {
        setMailLoading(false);
      }
    })();
  }, [userEmail]);

  const formatMailTime = (sentTime) => {
    if (!sentTime) return "";
    const date = new Date(sentTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffWeeks < 4) return `${diffWeeks}주 전`;
    if (diffMonths < 12) return `${diffMonths}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  return (
    <Card
      title="메일 리스트"
      sx={{ minWidth: 400 }}
    >
      {mailLoading ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          로딩 중...
        </Typography>
      ) : recentMails.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          받은 메일이 없습니다.
        </Typography>
      ) : (
        <List dense>
          {recentMails.map((mail) => (
            <ListItem
              key={mail.emailId}
              sx={{
                px: 0,
                py: 1,
                flexDirection: "column",
                alignItems: "flex-start",
                borderBottom: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "action.hover",
                },
                "&:last-child": { borderBottom: "none" }
              }}
              onClick={() => navigate(`/email/${mail.emailId}`)}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", mb: 0.5 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    mr: 1
                  }}
                >
                  {mail.senderName || mail.senderEmail || "알 수 없음"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatMailTime(mail.sentTime)}
                </Typography>
              </Box>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      wordBreak: "break-word"
                    }}
                  >
                    {mail.emailTitle || "(제목 없음)"}
                  </Typography>
                }
                sx={{ mt: 0 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}

