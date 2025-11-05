import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { getBoardDetail, deleteBoard } from "../api/boardAPI";
import { getFilesByBoard } from "../api/boardFileAPI";
import { getRepliesByBoard, createReply, deleteReply } from "../api/boardReplyAPI";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const BoardDetailPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await getBoardDetail(boardId);
      setBoard(res.data.data);
      const replyRes = await getRepliesByBoard(boardId);
      setReplies(replyRes.data.data);
      const fileRes = await getFilesByBoard(boardId);
      setFiles(fileRes.data.data);
    } catch (err) {
      console.error("상세 조회 실패:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [boardId]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    await createReply({ boardId, content: replyText });
    setReplyText("");
    loadData();
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteBoard(boardId);
    alert("삭제 완료");
    navigate("/board");
  };

  if (!board) return <Typography>로딩중...</Typography>;

  return (
    <Box>
      <Typography variant="h5">{board.title}</Typography>

      {/* 🔧 수정 1: 작성자 이름 필드 writerName 으로 변경 */}
      {/* 🔧 수정 2: 날짜를 한국 시간 형식으로 가독성 있게 표시 */}
      <Typography variant="body2" sx={{ mb: 2 }}>
        {board.writerName || "알 수 없음"} |{" "}
        {new Date(board.createdAt).toLocaleString()} | 조회수 {board.viewCount ?? 0}
      </Typography>

      {/* 수정 / 삭제 버튼 */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
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
          onClick={handleDelete}
        >
          삭제
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 본문 내용 */}
      <Typography sx={{ whiteSpace: "pre-line", mb: 4 }}>{board.content}</Typography>

      {/* 🔧 수정 3: 파일 미리보기 경로 수정 (s3ObjectKey 사용) */}
      {files.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">첨부파일</Typography>
          {files.map((f) => (
            <Box key={f.id}>
              <a
                href={f.s3ObjectKey} // ✅ 수정됨
                target="_blank"
                rel="noopener noreferrer"
              >
                {f.fileName}
              </a>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* 댓글 영역 */}
      <Typography variant="h6">댓글</Typography>
      {replies.map((r) => (
        <Box key={r.id} sx={{ borderBottom: 1, borderColor: "divider", py: 1 }}>
          {/* 🔧 수정 4: writerName 으로 필드명 통일 */}
          <Typography variant="body2">
            <b>{r.writerName || "익명"}</b>: {r.content}
          </Typography>
          <IconButton
            size="small"
            color="error"
            onClick={() => deleteReply(r.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      {/* 댓글 작성란 */}
      <Box sx={{ display: "flex", mt: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="댓글을 입력하세요"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <Button sx={{ ml: 1 }} variant="contained" onClick={handleReplySubmit}>
          등록
        </Button>
      </Box>
    </Box>
  );
};

export default BoardDetailPage;