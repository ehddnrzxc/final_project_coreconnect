import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { getBoardDetail, deleteBoard } from "../api/boardAPI";
import { getFilesByBoard } from "../api/boardFileAPI";
import {
  getRepliesByBoard,
  createReply,
  updateReply,
  deleteReply,
} from "../api/boardReplyAPI";

const BoardDetailPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const loginName = user?.name || "익명";
  const loginRole = user?.role;

  const [board, setBoard] = useState(null);
  const [files, setFiles] = useState([]);
  const [replies, setReplies] = useState([]);

  const [replyText, setReplyText] = useState("");
  const [replyParentId, setReplyParentId] = useState(null);
  const [editReplyId, setEditReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");

  const formatDateTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const loadAll = async () => {
    const detailRes = await getBoardDetail(boardId);
    setBoard(detailRes.data.data);

    const replyRes = await getRepliesByBoard(boardId);
    setReplies(replyRes.data.data || []);

    const fileRes = await getFilesByBoard(boardId);
    setFiles(fileRes.data.data || []);
  };

  useEffect(() => {
    loadAll();
  }, [boardId]);

  const canEditOrDeletePost = useMemo(() => {
    if (!board) return false;
    return loginRole === "ADMIN" || board.writerName === loginName;
  }, [board, loginName, loginRole]);

  const rootReplies = useMemo(
    () => (replies || []).filter((r) => !r.parentReplyId),
    [replies]
  );
  const childReplies = (parentId) =>
    (replies || []).filter((r) => r.parentReplyId === parentId);

  const handleDeletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteBoard(boardId);
    alert("게시글이 삭제되었습니다.");
    navigate("/board?page=0");
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    await createReply({
      boardId: Number(boardId),
      content: replyText,
      parentReplyId: replyParentId,
    });
    setReplyText("");
    setReplyParentId(null);
    await loadAll();
  };

  const handleReplyUpdate = async (replyId) => {
    if (!editReplyText.trim()) return alert("내용을 입력하세요.");
    await updateReply(replyId, { content: editReplyText });
    setEditReplyId(null);
    setEditReplyText("");
    await loadAll();
  };

  const handleReplyDelete = async (replyId) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    await deleteReply(replyId);
    await loadAll();
  };

  if (!board) return <Typography>로딩중...</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {board.title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        {board.writerName} | {formatDateTime(board.createdAt)} | 조회수{" "}
        {board.viewCount ?? 0}
      </Typography>

      {canEditOrDeletePost && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/board/edit/${board.id}`)}
          >
            수정
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeletePost}
          >
            삭제
          </Button>
        </Stack>
      )}

      {/* [수정] 게시글 내용이 없을 때 "등록된 내용이 없습니다." 표시 */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#fafafa",
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          {board.content?.trim() ? board.content : "등록된 내용이 없습니다."}
        </Typography>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6">댓글</Typography>
        <Typography variant="h6" color="primary">
          ({replies.length})
        </Typography>
      </Stack>

      {rootReplies.length === 0 && (
        <Typography color="text.secondary" sx={{ ml: 0.5, mb: 2 }}>
          아직 댓글이 없습니다.
        </Typography>
      )}

      {/* [수정] 부모 댓글 삭제 시에도 자식 댓글 유지 */}
      {rootReplies.map((r) => {
        const children = childReplies(r.id);

        // ✅ [추가] 대댓글이 없고 삭제된 부모 댓글은 표시하지 않음
        if (r.deletedYn && children.length === 0) {
          return null;
        }

        return (
          <React.Fragment key={r.id}>
            <Box sx={{ mb: 1.5 }}>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, bgcolor: "#fff", opacity: r.deletedYn ? 0.6 : 1 }}
              >
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
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      variant="outlined"
                    />
                    <Button
                      sx={{ ml: 1, minWidth: "70px" }}
                      variant="contained"
                      onClick={handleReplySubmit}
                    >
                      등록
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* [유지] 자식 댓글 렌더링 */}
            {children.map((child) => (
              <Paper
                key={child.id}
                variant="outlined"
                sx={{ ml: 4, mt: 1, p: 1.5, bgcolor: "#fcfcfc" }}
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

                  {(loginRole === "ADMIN" || child.writerName === loginName) && (
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
                    {child.content?.trim() ? child.content : "내용 없음"}
                  </Typography>
                )}
              </Paper>
            ))}
          </React.Fragment>
        );
      })}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "60%",
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
          onChange={(e) => setReplyText(e.target.value)}
          variant="outlined"
        />
        <Button
          sx={{ ml: 1, minWidth: "80px" }}
          variant="contained"
          onClick={handleReplySubmit}
        >
          등록
        </Button>
      </Box>
    </Box>
  );
};

export default BoardDetailPage;
