import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { fetchInbox, GetUserEmailFromStorage } from "../../email/api/emailApi";

export default function MailListCard() {
  const navigate = useNavigate();
  const [recentMails, setRecentMails] = useState([]);
  const [mailLoading, setMailLoading] = useState(true);

  // 받은메일함 최근 메일 가져오기
  useEffect(() => {
    (async () => {
      const userEmail = GetUserEmailFromStorage();
      if (!userEmail) {
        setMailLoading(false);
        return;
      }
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
  }, []);

  return (
    <Card
      title="메일 리스트"
      right={
        <Button
          component={Link}
          to="/email/inbox"
          size="small"
          sx={{ textTransform: "none" }}
        >
          받은메일함
        </Button>
      }
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
                py: 0.75,
                borderBottom: "1px solid #e5e7eb",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
              onClick={() => navigate(`/email/${mail.emailId}`)}
              secondaryAction={
                <Button
                  size="small"
                  sx={{ textTransform: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/email/${mail.emailId}`);
                  }}
                >
                  보기
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.25 }}
                  >
                    {mail.senderName || mail.senderEmail || "알 수 없음"}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mail.emailTitle || "(제목 없음)"}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}

