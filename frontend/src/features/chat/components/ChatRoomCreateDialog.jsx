import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Radio, RadioGroup, FormControlLabel, Autocomplete, Chip
} from "@mui/material";

// 사용자 목록 예시(실제 실서비스에서는 props로 전달받거나 API로 받아옵니다!)
const mockUsers = [
  { id: 5, email: "admin@gmail.com", name: "관리자" },
  { id: 6, email: "ehddnras@gmail.com", name: "이동욱" },
  { id: 7, email: "lyc@gmail.com", name: "이유천" },
  { id: 8, email: "shark@gmail.com", name: "샤크" },
  { id: 9, email: "choimeeyoung2@gmail.com", name: "최미영" },
  { id: 10, email: "sss@naver.com", name: "신성수" },
  { id: 13, email: "tiger@gmail.com", name: "호랑이" },
  { id: 14, email: "lyct777@naver.com", name: "냉면"}
];

// open: 다이얼로그 show/hide
// onClose: 다이얼로그 닫기 콜백
// onCreate: 생성 버튼 눌렀을 때 콜백. 인자로 { roomName, roomType: boolean, userIds: number[] }를 넘겨줌
function ChatRoomCreateDialog({ open, onClose, onCreate, allUsers = mockUsers }) {
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("group"); // "group" or "alone"
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState("");

  // 1:1에서 2명 이상 골랐을 때 마지막 1명만 남김
  useEffect(() => {
    if (roomType === "alone" && selectedUsers.length > 1) {
      setSelectedUsers(selectedUsers.slice(-1));
    }
  }, [roomType]);

  // Chip의 X 클릭(개별 user 삭제)
  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers((current) => current.filter((user) => user.id !== userToRemove.id));
  };

  // 생성 버튼 누를 때 유효성 체크 및 전달
  const handleCreate = () => {
    if (!roomName.trim()) {
      setError("채팅방 이름을 입력하세요.");
      return;
    }
    if (selectedUsers.length === 0) {
      setError("참여할 사용자를 한 명 이상 선택하세요.");
      return;
    }
    if (roomType === "alone" && selectedUsers.length !== 1) {
      setError("1:1 채팅은 대상을 한 명만 선택해야 합니다.");
      return;
    }
    if (roomType === "group" && selectedUsers.length < 2) {
      setError("그룹 채팅은 2명 이상을 선택해야 합니다.");
      return;
    }
    // 실제 생성 콜백 호출 (백엔드 DTO 구조에 맞게)
    onCreate({
      roomName,
      roomType: roomType === "group", // group: true, alone: false
      userIds: selectedUsers.map(u => u.id)
    });
    // 입력값 리셋
    setRoomName("");
    setSelectedUsers([]);
    setRoomType("group");
    setError("");
  };

  // 팝업 닫힐 때 폼 리셋
  const handleClose = () => {
    onClose();
    setError("");
    setRoomName("");
    setSelectedUsers([]);
    setRoomType("group");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>채팅방 생성</DialogTitle>
      <DialogContent>
        {/* 방 이름 */}
        <TextField
          label="채팅방 이름"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          autoFocus
          fullWidth
          margin="normal"
        />
        {/* 1:1 / 그룹 라디오 */}
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight="bold">채팅방 유형</Typography>
          <RadioGroup
            row
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
          >
            <FormControlLabel value="group" control={<Radio />} label="그룹" />
            <FormControlLabel value="alone" control={<Radio />} label="1:1" />
          </RadioGroup>
        </Box>
        {/* 참여자 선택 (Autocomplete + Chip X 삭제) */}
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight="bold">참여자(이메일)</Typography>
          <Autocomplete
            multiple={roomType === "group"}
            disableCloseOnSelect={roomType === "group"}
            options={allUsers}
            getOptionLabel={option => `${option.name} (${option.email})`}
            value={selectedUsers}
            onChange={(_, newValue) =>
              setSelectedUsers(roomType === "alone" ? newValue.slice(-1) : newValue)
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            // 핵심! Chip X 버튼으로 개별 삭제 처리
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option.id}
                  label={`${option.name} (${option.email})`}
                  sx={{ mr: 1 }}
                  onDelete={() => handleRemoveUser(option)}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField {...params} variant="outlined" placeholder="참여자 이메일/이름" />
            )}
            limitTags={3}
          />
        </Box>
        {/* 에러 메시지 */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          * 채팅방 이름, 유형, 참여자를 모두 입력해 주세요. (X 버튼으로 초대 취소 가능)
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button onClick={handleCreate} variant="contained" color="primary">생성</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChatRoomCreateDialog;