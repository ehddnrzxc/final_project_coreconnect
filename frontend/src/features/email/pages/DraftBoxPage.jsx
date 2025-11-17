// DraftBoxPage.jsx - 임시보관함 목록 및 삭제 기능 페이지
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Pagination, Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchDraftbox, deleteDraftMail, GetUserEmailFromStorage } from "../api/emailApi";
import { useNavigate } from "react-router-dom";

const DraftBoxPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);

  const userEmail = GetUserEmailFromStorage();
  const navigate = useNavigate();

  // 임시보관함 목록 조회 및 상태값 세팅
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

  // [핵심] 임시메일 삭제 - 클릭시 확인 후 삭제 API 호출&목록 새로고침
const handleDelete = async (draftId) => {
  if (!window.confirm("정말로 이 임시저장 메일을 삭제하시겠습니까?")) return;
  try {
    const res = await deleteDraftMail(draftId);
    console.log("삭제 응답:", res);
    reload();
  } catch (e) {
    console.error("삭제 에러:", e);
    alert("삭제 요청 실패: " + (e?.message || e));
  }
};

  // 메일 클릭 시: 쓰기페이지 이동 (draftId 전달)
  const handleRowClick = (draft) => {
    navigate(`/email/write?draftId=${draft.emailId}`);
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
                  // 행 클릭: 메일 쓰기 이동
                  onClick={() => handleRowClick(draft)}
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
                  {/* 삭제 버튼만 누를 때 행 클릭 이벤트 버블 차단 */}
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