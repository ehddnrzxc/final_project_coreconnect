import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Radio, RadioGroup, FormControlLabel, Autocomplete, Chip
} from "@mui/material";
import http from "../../../api/http";

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
  const [inputValue, setInputValue] = useState(""); // 입력 필드의 현재 값

  // 1:1 채팅방에서 본인 포함 3명 이상 선택 시 에러 메시지 표시 (본인 포함 2명까지 가능)
  useEffect(() => {
    if (roomType === "alone" && selectedUsers.length > 2) {
      setError("세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)");
    } else if (roomType === "alone" && selectedUsers.length <= 2 && error === "세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)") {
      setError(""); // 에러 메시지 초기화
    }
  }, [roomType, selectedUsers.length, error]);

  // Chip의 X 클릭(개별 user 삭제)
  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers((current) => current.filter((user) => {
      // id가 있는 경우 id로 비교, 없으면 이메일로 비교
      if (userToRemove.id && user.id) {
        return user.id !== userToRemove.id;
      }
      return user.email !== userToRemove.email;
    }));
  };

  // 이메일 형식 검증
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 주소로 사용자 찾기 (API 호출)
  const findUserByEmail = async (email) => {
    try {
      // 사용자 목록 API 호출 (모든 사용자 조회)
      const res = await http.get("/user");
      if (res && res.data && Array.isArray(res.data)) {
        const user = res.data.find(u => u.email === email);
        if (user) {
          return { id: user.id, email: user.email, name: user.name };
        }
      }
      return null;
    } catch (error) {
      console.error("사용자 조회 실패:", error);
      return null;
    }
  };

  // 생성 버튼 누를 때 유효성 체크 및 전달
  const handleCreate = async () => {
    if (!roomName.trim()) {
      setError("채팅방 이름을 입력하세요.");
      return;
    }
    if (selectedUsers.length === 0) {
      setError("참여할 사용자를 한 명 이상 선택하세요.");
      return;
    }
    // 1:1 채팅방인 경우 본인 포함 3명 이상 선택 체크 (본인 포함 2명까지 가능)
    if (roomType === "alone" && selectedUsers.length > 2) {
      setError("세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)");
      return;
    }
    if (roomType === "alone" && selectedUsers.length === 0) {
      setError("1:1 채팅은 본인 포함 2명을 선택해야 합니다.");
      return;
    }
    if (roomType === "group" && selectedUsers.length < 2) {
      setError("그룹 채팅은 2명 이상을 선택해야 합니다.");
      return;
    }

    // 입력 필드에 남아있는 이메일 주소가 있으면 처리
    if (inputValue.trim() && isValidEmail(inputValue.trim())) {
      const trimmedEmail = inputValue.trim();
      const alreadySelected = selectedUsers.some(u => u.email === trimmedEmail);
      if (!alreadySelected) {
        // 이메일로 사용자 찾기
        const foundUser = await findUserByEmail(trimmedEmail);
        if (foundUser) {
          if (roomType === "alone") {
            setSelectedUsers([foundUser]);
          } else {
            setSelectedUsers([...selectedUsers, foundUser]);
          }
          setInputValue("");
          // 재귀 호출하여 다시 검증 및 생성
          setTimeout(() => handleCreate(), 100);
          return;
        } else {
          setError(`입력하신 이메일 주소(${trimmedEmail})로 사용자를 찾을 수 없습니다.`);
          return;
        }
      }
    }

    // 모든 사용자가 id를 가지고 있는지 확인
    const usersWithIds = selectedUsers.filter(u => u.id);
    if (usersWithIds.length !== selectedUsers.length) {
      setError("일부 사용자의 정보가 올바르지 않습니다. 다시 선택해주세요.");
      return;
    }

    // 실제 생성 콜백 호출 (백엔드 DTO 구조에 맞게)
    onCreate({
      roomName,
      roomType: roomType === "group", // group: true, alone: false
      userIds: selectedUsers.map(u => u.id).filter(id => id != null)
    });
    // 입력값 리셋
    setRoomName("");
    setSelectedUsers([]);
    setRoomType("group");
    setError("");
    setInputValue("");
  };

  // 팝업 닫힐 때 폼 리셋
  const handleClose = () => {
    onClose();
    setError("");
    setRoomName("");
    setSelectedUsers([]);
    setRoomType("group");
    setInputValue("");
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
            freeSolo
            multiple={true} // 항상 multiple로 설정 (1:1일 때도 여러명 선택 가능하게)
            disableCloseOnSelect={true} // 항상 true로 설정
            options={allUsers}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
              // "세 명 이상 선택할 수 없습니다" 에러가 아닌 경우에만 초기화
              if (error !== "세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)") {
                setError("");
              }
            }}
            getOptionLabel={option => {
              if (typeof option === "string") {
                // 직접 입력된 문자열인 경우
                return option;
              }
              if (!option || !option.name || !option.email) return "";
              return `${option.name} (${option.email})`;
            }}
            value={selectedUsers} // 항상 배열로 처리
            onChange={async (_, newValue) => {
              // newValue는 항상 배열
              const processedValues = [];
              
              // 배열 처리 (그룹/1:1 공통)
              for (const val of (Array.isArray(newValue) ? newValue : [])) {
                if (typeof val === "string") {
                  // 직접 입력된 이메일 주소인 경우
                  const trimmedEmail = val.trim();
                  if (isValidEmail(trimmedEmail)) {
                    const foundUser = await findUserByEmail(trimmedEmail);
                    if (foundUser) {
                      processedValues.push(foundUser);
                    } else {
                      setError(`입력하신 이메일 주소(${trimmedEmail})로 사용자를 찾을 수 없습니다.`);
                    }
                  } else {
                    setError("올바른 이메일 형식이 아닙니다.");
                  }
                } else {
                  processedValues.push(val);
                }
              }
              
              // 1:1 채팅방인 경우 본인 포함 3명 이상 선택 체크 (본인 포함 2명까지 가능)
              if (roomType === "alone" && processedValues.length > 2) {
                setError("세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)");
                return; // 선택하지 않음
              }
              
              setSelectedUsers(processedValues);
              setInputValue("");
              // 에러 메시지 초기화 (성공적으로 처리된 경우)
              if (error !== "세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)") {
                setError("");
              }
            }}
            isOptionEqualToValue={(option, value) => {
              if (!option || !value) return false;
              if (typeof option === "string" || typeof value === "string") {
                return option === value;
              }
              // id가 있으면 id로 비교, 없으면 이메일로 비교
              if (option.id && value.id) {
                return option.id === value.id;
              }
              return option.email === value.email;
            }}
            filterOptions={(options, params) => {
              const filtered = options.filter(option => {
                const input = params.inputValue.toLowerCase();
                return (
                  option.name?.toLowerCase().includes(input) ||
                  option.email?.toLowerCase().includes(input)
                );
              });
              
              // 입력값이 이메일 형식이고 옵션에 없으면 추가
              if (params.inputValue && isValidEmail(params.inputValue.trim())) {
                const emailExists = filtered.some(opt => opt.email === params.inputValue.trim());
                if (!emailExists) {
                  filtered.push(params.inputValue.trim());
                }
              }
              
              return filtered;
            }}
            // 핵심! Chip X 버튼으로 개별 삭제 처리
            renderTags={(value, getTagProps) =>
              Array.isArray(value) ? value.map((option, index) => {
                const label = typeof option === "string" 
                  ? option 
                  : `${option.name || ""} (${option.email || ""})`;
                const key = typeof option === "string" 
                  ? option 
                  : (option.id || option.email || index);
                return (
                  <Chip
                    key={key}
                    label={label}
                    sx={{ mr: 1 }}
                    onDelete={() => handleRemoveUser(option)}
                    {...getTagProps({ index })}
                  />
                );
              }) : null
            }
            renderInput={params => (
              <TextField 
                {...params} 
                variant="outlined" 
                placeholder="참여자 이메일/이름 입력 또는 선택"
                onBlur={async (e) => {
                  // 포커스 아웃 시 입력된 이메일 주소 처리
                  const trimmedValue = e.target.value?.trim();
                  if (trimmedValue && isValidEmail(trimmedValue)) {
                    const alreadySelected = selectedUsers.some(u => 
                      (typeof u === "string" ? u === trimmedValue : u.email === trimmedValue)
                    );
                    if (!alreadySelected) {
                      // 1:1 채팅방인 경우 본인 포함 3명 이상 체크 (본인 포함 2명까지 가능)
                      if (roomType === "alone" && selectedUsers.length >= 2) {
                        setError("세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)");
                        setInputValue("");
                        return;
                      }
                      
                      const foundUser = await findUserByEmail(trimmedValue);
                      if (foundUser) {
                        // 1:1 채팅방인 경우 다시 한번 체크
                        if (roomType === "alone" && selectedUsers.length >= 2) {
                          setError("세 명 이상 선택할 수 없습니다 (본인 포함 2명만 선택하세요)");
                          setInputValue("");
                          return;
                        }
                        setSelectedUsers([...selectedUsers, foundUser]);
                        setInputValue("");
                      } else {
                        setError(`입력하신 이메일 주소(${trimmedValue})로 사용자를 찾을 수 없습니다.`);
                      }
                    } else {
                      setInputValue("");
                    }
                  }
                }}
              />
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