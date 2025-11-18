// DraftBoxPage.jsx - 임시보관함 목록 및 삭제 기능 페이지
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Pagination, Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchDraftbox, deleteDraftMail } from "../api/emailApi";
// ★ 사용자 이메일을 가져오는 커스텀 훅 import (Context 구조에 맞게!)
import useUserEmail from '../../email/hook/useUserEmail';
import { useNavigate } from "react-router-dom";

const DraftBoxPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);

  // ★ 커스텀 훅 사용: context.userProfile.email 반환 (App에서 value={{userProfile, setUserProfile}} 구조여야 정상동작)
  const userEmail = useUserEmail();
  const navigate = useNavigate();

  // 임시보관함 목록 조회 및 상태값 세팅 함수
  const reload = () => {
    // 2. reload에서 userEmail 값 찍기
    console.log('reload() - userEmail:', userEmail); // 👈 이 줄도 추가
    if (!userEmail) {
      // userEmail이 null/undefined면 API 호출 금지
      return;
    }
    setLoading(true);
    fetchDraftbox(userEmail, page - 1, size)
      .then(res => {
        // 3. fetchDraftbox 응답 전체 한 번 찍기
        console.log('fetchDraftbox response:', res); // 👈 이 줄 추가

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

  // ★ 페이지 변경, userEmail 변경 시 목록 갱신
  useEffect(() => {
    reload();
    // eslint-disable-next-line
  }, [page, userEmail]); // userEmail 변경을 반드시 의존성 배열에 넣는다!

  // [핵심] 임시메일 삭제 - 클릭시 확인 후 삭제 API 호출&목록 새로고침
  const handleDelete = async (draftId) => {
    // ★ confirm 다이얼로그로 삭제 의사 확인
    if (!window.confirm("정말로 이 임시저장 메일을 삭제하시겠습니까?")) return;
    try {
      const res = await deleteDraftMail(draftId);
      // 삭제 후 다시 목록 새로고침
      reload();
    } catch (e) {
      console.error("삭제 에러:", e);
      alert("삭제 요청 실패: " + (e?.message || e));
    }
  };

  // 메일 클릭 시: 쓰기페이지로 이동 (draftId만 쿼리로 전달)
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
                <TableCell colSpan={5} align="center">
                  {/* ★ drafts 비어있을 때 안내 메시지 */}
                  임시저장 메일이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              drafts.map(draft => (
                <TableRow
                  key={draft.emailId}
                  hover
                  style={{ cursor: "pointer" }}
                  // ★ 행 클릭: 해당 임시메일 쓰기페이지로 이동
                  onClick={() => handleRowClick(draft)}
                >
                  <TableCell>{draft.emailTitle}</TableCell>
                  <TableCell>
                    {/* ★ 작성일 포맷팅 */}
                    {draft.sentTime
                      ? (typeof draft.sentTime === "string"
                        ? new Date(draft.sentTime).toLocaleString()
                        : draft.sentTime)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {/* ★ 받는사람 정보 */}
                    {Array.isArray(draft.recipientAddresses) && draft.recipientAddresses.length > 0
                      ? draft.recipientAddresses.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {/* ★ 파일수: attachments/또는 fileIds 배열 중 하나라도 있으면 출력 */}
                    {Array.isArray(draft.attachments)
                      ? draft.attachments.length
                      : (Array.isArray(draft.fileIds) ? draft.fileIds.length : 0)
                    }
                  </TableCell>
                  {/* ★ 삭제버튼은 클릭 이벤트 버블링 차단 */}
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

/*
=========================
주요 주석 요약 및 체크리스트
-------------------------
★ useUserEmail() 훅은 반드시 context.userProfile.email 구조에 맞춰 작성되어야 정상동작
  (즉, App.jsx에서 Provider value가 { userProfile, setUserProfile } 구조일 때)
★ 실제 userEmail 값이 null이면 API 호출 금지. Profile 비동기 처리 시에는 최초엔 null→email로 전환됨
★ userEmail 값이 제대로 들어 올 때만 reload()/fetchDraftbox API가 동작 → 데이터 표시됨
★ 항상 실제 App에서 Context value 구조와 훅 구현, 그리고 각종 로그를 찍어서 값이 있는지 점검!
=========================
*/