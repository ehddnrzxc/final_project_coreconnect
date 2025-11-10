import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Pagination, Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchDraftbox, deleteDraftMail, getUserEmailFromStorage } from "../api/emailApi";
import { useNavigate } from "react-router-dom";

// 임시보관함(임시저장 메일) 목록/개수/삭제 페이지
const DraftBoxPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);

  const userEmail = getUserEmailFromStorage();
  const navigate = useNavigate();

  // 목록/개수 동시 조회
  const reload = () => {
    if (!userEmail) return;
    setLoading(true);
    fetchDraftbox(userEmail, page - 1, size)
      .then(res => {
        const boxData = res?.data?.data;
        setDrafts(boxData?.content || []);
        setTotal(
          typeof boxData?.totalElements === "number"
            ? boxData.totalElements
            : (Array.isArray(boxData?.content) ? boxData.content.length : 0)
        );
      })
      .catch(err => {
        console.error("[DraftBoxPage] fetchDraftbox 실패", err);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line
  }, [page, userEmail]);

  // 삭제
  const handleDelete = async (draftId) => {
    if (!window.confirm("정말로 이 임시저장 메일을 삭제하시겠습니까?")) return;
    await deleteDraftMail(draftId);
    reload();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          임시보관함
          <Chip
            label={`총 ${total}개`}
            color={total > 0 ? "primary" : "default"}
            sx={{ ml: 2 }}
          />
        </Typography>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>작성일</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>받는사람</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>파일 수</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>삭제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">임시저장 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              drafts.map(draft => (
                <TableRow
                  key={draft.emailId}
                  hover
                  style={{ cursor: "pointer" }}
                  // [수정1] 행 전체 클릭 시 메일쓰기 페이지로 이동하고, draftId를 querystring으로 전달합니다 (메일작성시 바인딩)
                  onClick={() => navigate(`/email/write?draftId=${draft.emailId}`)}
                >
                  <TableCell>{draft.emailTitle}</TableCell>
                  <TableCell>
                    {draft.sentTime
                      ? (typeof draft.sentTime === "string"
                        ? new Date(draft.sentTime).toLocaleString()
                        : draft.sentTime)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(draft.recipientAddresses) && draft.recipientAddresses.length > 0
                      ? draft.recipientAddresses.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(draft.attachments)
                      ? draft.attachments.length
                      : (Array.isArray(draft.fileIds) ? draft.fileIds.length : 0)
                    }
                  </TableCell>
                  {/* [수정2] 삭제 버튼만 클릭 시 onClick이 행으로 버블되지 않도록 이벤트 전파 차단 */}
                  <TableCell align="center" onClick={e => { e.stopPropagation(); handleDelete(draft.emailId); }}>
                    <IconButton color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(total / size)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default DraftBoxPage;