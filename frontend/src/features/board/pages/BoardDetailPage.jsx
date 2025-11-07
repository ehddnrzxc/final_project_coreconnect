import React, { useEffect, useMemo, useState, useRef } from "react"; // React 훅: 상태관리, 렌더링 최적화, 생명주기 제어
import { useParams, useNavigate } from "react-router-dom"; // React Router 훅: URL 파라미터와 페이지 이동 관리
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Stack,
  Paper,
} from "@mui/material"; // MUI: 레이아웃/텍스트/UI 기본 구성요소
import ReplyIcon from "@mui/icons-material/Reply"; // MUI: 답글 아이콘
import EditIcon from "@mui/icons-material/Edit"; // MUI: 수정 아이콘
import DeleteIcon from "@mui/icons-material/Delete"; // MUI: 삭제 아이콘

import { getBoardDetail, deleteBoard } from "../api/boardAPI"; // 게시글 관련 API 함수
import { getFilesByBoard } from "../api/boardFileAPI"; // 게시글 첨부파일 API
import {
  getRepliesByBoard,
  createReply,
  updateReply,
  deleteReply,
} from "../api/boardReplyAPI"; // 댓글 관련 API

// 게시글 상세 페이지 컴포넌트
const BoardDetailPage = () => {
  const { boardId } = useParams(); // URL 경로에서 게시글 ID 추출
  const navigate = useNavigate(); // 페이지 이동용 훅

  // 로그인 사용자 정보 로드
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const loginName = user?.name || "익명"; // 로그인 이름 (없으면 '익명')
  const loginRole = user?.role; // 사용자 역할

  // 상태 정의
  const [board, setBoard] = useState(null); // 게시글 상세 데이터
  const [files, setFiles] = useState([]); // 첨부파일 목록
  const [replies, setReplies] = useState([]); // 댓글 목록

  // 댓글 입력/수정 상태
  const [replyText, setReplyText] = useState(""); // 일반 댓글 내용
  const [childReplyText, setChildReplyText] = useState(""); // 대댓글(답글) 입력용
  const [replyParentId, setReplyParentId] = useState(null); // 부모 댓글 ID (대댓글일 경우)
  const [editReplyId, setEditReplyId] = useState(null); // 수정 중인 댓글 ID
  const [editReplyText, setEditReplyText] = useState(""); // 수정 중 댓글 내용

  // 날짜 포맷 변환 함수
  const formatDateTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const alertShownRef = useRef(false); // 알럿 중복 방지용 ref

  // 게시글, 댓글, 파일 데이터 전체 로드
  const loadAll = async () => {
    try {
      const detailRes = await getBoardDetail(boardId); // 게시글 상세조회
      setBoard(detailRes.data.data);

      const replyRes = await getRepliesByBoard(boardId); // 댓글 목록 조회
      setReplies(replyRes.data.data || []);

      const fileRes = await getFilesByBoard(boardId); // 첨부파일 목록 조회
      setFiles(fileRes.data.data || []);
    } catch (err) {
      if (alertShownRef.current) return; // 이미 알럿 띄웠으면 더 이상 실행 안 함
      alertShownRef.current = true; // 첫 에러 시 한 번만 true로 설정

      // 비공개글 접근 차단 처리
      if (err.response?.status === 403) {
        alert("비공개 게시글입니다. 접근할 수 없습니다.");
        navigate(-1); // 바로 이전 페이지로 돌아감
        return;
      }
      // 존재하지 않거나 삭제된 게시글
      if (err.response?.status === 404) {
        alert("존재하지 않거나 삭제된 게시글입니다.");
        navigate(-1);
        return;
      }
      // 기타 예외
      alert("게시글을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 페이지 로드 시 게시글/댓글 불러오기
  useEffect(() => {
    loadAll();
  }, [boardId]);

  // 작성자 or 관리자만 수정/삭제 가능
  const canEditOrDeletePost = useMemo(() => {
    if (!board) return false;
    return loginRole === "ADMIN" || board.writerName === loginName;
  }, [board, loginName, loginRole]);

  // 부모 댓글과 자식 댓글 분리
  const rootReplies = useMemo(
    () => (replies || []).filter((r) => !r.parentReplyId), // 부모 댓글
    [replies]
  );
  const childReplies = (parentId) =>
    (replies || []).filter((r) => r.parentReplyId === parentId); // 자식 댓글

  // 상세 헤더용 "표시할 댓글 수" (삭제된 댓글 제외)
  const visibleReplyCount = useMemo(
    () => (replies || []).filter((r) => !r.deletedYn).length,
    [replies]
  );

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return; // 삭제 확인
    await deleteBoard(boardId);
    alert("게시글이 삭제되었습니다.");
    navigate(-1);
  };

  // 댓글 등록 (일반 댓글 전용)
  const handleReplySubmit = async () => {
    if (!replyText.trim()) return; // 빈 문자열 방지
    await createReply({
      boardId: Number(boardId),
      content: replyText,
    });
    setReplyText(""); // 입력 초기화
    await loadAll(); // 새로고침
  };

  // 대댓글 등록
  const handleChildReplySubmit = async () => {
    if (!childReplyText.trim()) return; // 빈 문자열 방지
    await createReply({
      boardId: Number(boardId),
      content: childReplyText,
      parentReplyId: replyParentId,
    });
    setChildReplyText(""); // 대댓글 입력값 초기화
    setReplyParentId(null); // 입력창 닫기
    await loadAll(); // 새로고침
  };

  // 댓글 수정
  const handleReplyUpdate = async (replyId) => {
    if (!editReplyText.trim()) return alert("내용을 입력하세요.");
    await updateReply(replyId, { content: editReplyText });
    setEditReplyId(null);
    setEditReplyText("");
    await loadAll();
  };

  // 댓글 삭제
  const handleReplyDelete = async (replyId) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    await deleteReply(replyId);
    await loadAll();
  };

  // 게시글이 없을 때 로딩 표시
  if (!board) return <Typography>알 수 없는 페이지</Typography>;

  return (
    <Box> 
      <Typography variant="h5" sx={{ mb: 1 }}>
        {board.title} {/* 게시글 제목 */}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        {board.writerName} | {formatDateTime(board.createdAt)} | 조회수{" "}
        {board.viewCount ?? 0}
      </Typography>

      {/* 게시글 작성자 or 관리자만 수정/삭제 버튼 표시 */}
      {canEditOrDeletePost && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ fontSize: "0.8rem", py: 0.5, px: 1.5 }}
            startIcon={<EditIcon />} // 수정 아이콘
            onClick={() => navigate(`/board/edit/${board.id}`)} // 수정 페이지로 이동
          >
            수정
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            sx={{ fontSize: "0.8rem", py: 0.5, px: 1.5 }}
            startIcon={<DeleteIcon />} // 삭제 아이콘
            onClick={handleDeletePost} // 게시글 삭제 실행
          >
            삭제
          </Button>
        </Stack>
      )}

      {/* 게시글 본문 */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          bgcolor: "#fff",
          width: "80%",
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontStyle: "italic",
            minHeight: "330px", // 약 15줄 정도 기본 높이 확보
            lineHeight: 1.6, // 줄 간격
            whiteSpace: "pre-wrap", // 줄바꿈(\n) 유지
          }}
        >
          {board.content?.trim() ? board.content : "등록된 내용이 없습니다."}
        </Typography>
      </Paper>

      {/* 댓글 섹션 제목 */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6">댓글</Typography>
        <Typography variant="h6" color="primary">
          ({visibleReplyCount}) {/* 삭제된 댓글 제외 카운트 */}
        </Typography>
      </Stack>

      {/* 댓글이 없을 경우 안내문 */}
      {rootReplies.length === 0 && (
        <Typography color="text.secondary" sx={{ ml: 0.5, mb: 2, width: "80%" }}>
          아직 댓글이 없습니다.
        </Typography>
      )}

      {/* 댓글 목록 렌더링 */}
      <Box sx={{ width: "80%" }}>
        {rootReplies.map((r) => {
          const children = childReplies(r.id); // 대댓글 목록 필터링

          // 삭제된 부모 + 자식 댓글 없음 → 표시하지 않음
          if (r.deletedYn && children.length === 0) {
            return null;
          }

          return (
            <React.Fragment key={r.id}>
              <Box sx={{ mb: children.length ? 0 : 2 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "#fff", opacity: r.deletedYn ? 0.6 : 1 }}
                >
                  {/* 댓글 상단 영역 */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {r.writerName || "익명"}{" "}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        ({formatDateTime(r.createdAt)})
                      </Typography>
                    </Typography>

                    {/* 댓글 수정/삭제 */}
                    {!r.deletedYn &&
                      (loginRole === "ADMIN" || r.writerName === loginName) && (
                        <Stack direction="row" spacing={1}>
                          {editReplyId !== r.id ? (
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ cursor: "pointer" }}
                                onClick={() => {
                                  setEditReplyId(r.id);
                                  setEditReplyText(r.content);
                                }}
                              >
                                수정
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ cursor: "pointer" }}
                                onClick={() => handleReplyDelete(r.id)}
                              >
                                삭제
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{ cursor: "pointer" }}
                                onClick={() => handleReplyUpdate(r.id)}
                              >
                                저장
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ cursor: "pointer" }}
                                onClick={() => setEditReplyId(null)}
                              >
                                취소
                              </Typography>
                            </>
                          )}
                        </Stack>
                      )}
                  </Stack>

                  {/* 댓글 내용 */}
                  {r.deletedYn ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, fontStyle: "italic" }}
                    >
                      삭제된 댓글입니다.
                    </Typography>
                  ) : editReplyId === r.id ? (
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {r.content?.trim() ? r.content : "내용 없음"}
                    </Typography>
                  )}

                  {/* 답글 버튼 */}
                  {!r.deletedYn && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{
                        cursor: "pointer",
                        mt: 1,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      onClick={() =>
                        setReplyParentId(replyParentId === r.id ? null : r.id)
                      }
                    >
                      <ReplyIcon fontSize="small" sx={{ mr: 0.3 }} />
                      답글
                    </Typography>
                  )}

                  {/* 답글 입력창 (childReplyText 사용) */}
                  {replyParentId === r.id && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        ml: 3,
                        p: 1,
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        bgcolor: "#fafafa",
                        width: "80%",
                      }}
                    >
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        placeholder="답글을 입력하세요"
                        value={childReplyText}
                        onChange={(e) => setChildReplyText(e.target.value)}
                        variant="outlined"
                      />
                      <Button
                        sx={{ ml: 1, minWidth: "70px" }}
                        variant="contained"
                        onClick={handleChildReplySubmit}
                      >
                        등록
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* 대댓글 렌더링 */}
              {children
                .filter((child) => !child.deletedYn)
                .map((child, idx) => (
                  <Paper
                    key={child.id}
                    variant="outlined"
                    sx={{
                      ml: 4,
                      mt: idx === 0 ? "2px" : "4px",  // 첫 대댓글은 완전 붙이기 
                      mb: idx === children.length - 1 ? "16px" : "2px", // 마지막만 띄움
                      p: 1.5,
                      bgcolor: "#fcfcfc"
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        ↳ {child.writerName}{" "}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          ({formatDateTime(child.createdAt)})
                        </Typography>
                      </Typography>

                      {(loginRole === "ADMIN" ||
                        child.writerName === loginName) && (
                          <Stack direction="row" spacing={1}>
                            {editReplyId !== child.id ? (
                              <>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setEditReplyId(child.id);
                                    setEditReplyText(child.content);
                                  }}
                                >
                                  수정
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => handleReplyDelete(child.id)}
                                >
                                  삭제
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => handleReplyUpdate(child.id)}
                                >
                                  저장
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => setEditReplyId(null)}
                                >
                                  취소
                                </Typography>
                              </>
                            )}
                          </Stack>
                        )}
                    </Stack>

                    {/* 대댓글 내용 */}
                    {editReplyId === child.id ? (
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {child.content?.trim()
                          ? child.content
                          : "내용 없음"}
                      </Typography>
                    )}
                  </Paper>
                ))}
            </React.Fragment>
          );
        })}
      </Box>

      {/* 댓글 입력창 (새 댓글 작성용) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "80%",
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 1.5,
          bgcolor: "#fafafa",
          mt: 3,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            mr: 2,
            color: "text.secondary",
            whiteSpace: "nowrap",
            minWidth: 70,
          }}
        >
          {loginName}
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder="댓글을 입력하세요"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)} // 입력 시 상태 갱신
          variant="outlined"
        />
        <Button
          sx={{ ml: 1, minWidth: "80px" }}
          variant="contained"
          onClick={handleReplySubmit} // 등록 버튼 클릭 시 실행
        >
          등록
        </Button>
      </Box>
    </Box>
  );
};

export default BoardDetailPage;
