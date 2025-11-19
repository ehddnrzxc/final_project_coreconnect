// DraftBoxPage.jsx - 임시보관함 목록 및 삭제 기능 페이지
import React, { useEffect, useState, useContext } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Pagination, Chip, Snackbar, Alert, Menu, MenuItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SyncIcon from "@mui/icons-material/Sync";
import { fetchDraftbox, deleteDraftMail, fetchDraftCount } from "../api/emailApi"; // ★ fetchDraftCount 추가!
import { UserProfileContext } from "../../../App";
import { useNavigate } from "react-router-dom";
import { MailCountContext } from "../../../App"; // ★ 임시보관함/언리드 context

const DraftBoxPage = () => {
  // 임시 메일 목록, 전체 개수, 페이지, 페이지당 크기, 로딩상태, 임시카운트, 스낵바 상태
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10); // 페이지당 항목 수 (5 또는 10 선택 가능)
  const [loading, setLoading] = useState(false);
  const [sizeMenuAnchor, setSizeMenuAnchor] = useState(null); // 페이지 크기 선택 메뉴
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  // ★ context에서 draftCount, refreshDraftCount 받아오기
  const { draftCount = 0, refreshDraftCount = () => {} } = useContext(MailCountContext) || {};
  // 로그인 유저 email 추출
  const { userProfile } = useContext(UserProfileContext) || {};
  const userEmail = userProfile?.email;
  const navigate = useNavigate();

  // 임시보관함 목록 조회 및 상태 세팅
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
        setDrafts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  // ★ 임시보관함 개수 카운트 최신화 → context & chip 등에서 사용
  const updateDraftCount = async () => {
    if (!userEmail) return;
    try {
      const count = await fetchDraftCount(userEmail);
      // context의 refreshDraftCount 함수 호출 - 사이드바/상단 Chip 등 모두 동기화
      refreshDraftCount(count);
    } catch (err) {
      refreshDraftCount(0);
    }
  };

  // ★ 페이지/이메일 변경/삭제 후 → 목록/카운트 동시 갱신
  useEffect(() => {
    reload();
    updateDraftCount();
    // eslint-disable-next-line
  }, [page, size, userEmail]); // page, size, userEmail 변경시 갱신

  // ★ 임시메일 삭제
  const handleDelete = async (draftId) => {
    if (!window.confirm("정말로 이 임시저장 메일을 삭제하시겠습니까?")) return;
    try {
      await deleteDraftMail(draftId);
      setSnack({ open: true, severity: "success", message: "임시보관 메일을 삭제했습니다." });
      reload();          // 목록 새로고침
      updateDraftCount();// 임시메일 개수 갱신
    } catch (e) {
      setSnack({ open: true, severity: "error", message: "삭제 요청 실패!" });
      console.error("삭제 에러:", e);
    }
  };

  const handleRefresh = () => {
    reload();
    updateDraftCount();
  };

  // 메일 클릭: 임시메일로 쓰기
  const handleRowClick = (draft) => {
    navigate(`/email/write?draftId=${draft.emailId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            임시보관함
            {/* Chip에 최신 draftCount 사용, fallback: total */}
            <Chip
              label={`총 ${draftCount ?? total}개`}
              color={(draftCount ?? total) > 0 ? "primary" : "default"}
              sx={{ ml: 2 }}
            />
          </Typography>
          <Paper 
            sx={{ display: 'inline-flex', alignItems: 'center', px: 0.5, cursor: 'pointer' }}
            onClick={(e) => setSizeMenuAnchor(e.currentTarget)}
          >
            <Typography sx={{ px: 0.5, fontWeight: 500, fontSize: 15 }}>{size}</Typography>
            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
          </Paper>
          <IconButton onClick={handleRefresh} sx={{ ml: 1 }}>
            <SyncIcon />
          </IconButton>
          <Menu
            anchorEl={sizeMenuAnchor}
            open={Boolean(sizeMenuAnchor)}
            onClose={() => setSizeMenuAnchor(null)}
          >
            <MenuItem 
              onClick={() => {
                setSize(5);
                setPage(1);
                setSizeMenuAnchor(null);
              }}
              selected={size === 5}
            >
              5개씩 보기
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setSize(10);
                setPage(1);
                setSizeMenuAnchor(null);
              }}
              selected={size === 10}
            >
              10개씩 보기
            </MenuItem>
          </Menu>
        </Box>
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
                <TableCell colSpan={5} align="center">
                  임시저장 메일이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              drafts.map(draft => (
                <TableRow
                  key={draft.emailId}
                  hover
                  style={{ cursor: "pointer" }}
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
      {/* SnackBar: 삭제 성공/실패 안내 */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DraftBoxPage;

/*
=========================
주요 주석 요약 및 체크리스트
-------------------------
★ UserProfileContext에서 userProfile.email을 직접 사용
★ 실제 userEmail 값이 null이면 API 호출 금지. Profile 비동기 처리 시에는 최초엔 null→email로 전환됨
★ userEmail 값이 제대로 들어 올 때만 reload()/fetchDraftbox API가 동작 → 데이터 표시됨
=========================
*/

