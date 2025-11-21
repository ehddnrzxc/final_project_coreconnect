import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
  Chip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, 
  Checkbox, Avatar, CircularProgress
} from "@mui/material";
import http from "../../../api/http";

// 주소록 팝업 컴포넌트
// open: 팝업 show/hide
// onClose: 팝업 닫기 콜백
// onConfirm: 확인 버튼 눌렀을 때 콜백. 인자로 선택한 사용자들의 이메일 주소 배열을 넘겨줌
// initialSelectedEmails: 이미 선택된 이메일 주소 배열 (중복 방지용)
function AddressBookDialog({ open, onClose, onConfirm, initialSelectedEmails = [] }) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 사용자 목록 DB에서 가져오기
  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      setSearchTerm("");
      setSelectedUsers([]);
      
      // 여러 API를 시도하는 fallback 로직
      const fetchUsers = async () => {
        try {
          // 1순위: /user/organization (조직도 API - 부서 정보 포함)
          let res = await http.get("/user/organization");
          let users = [];
          
          if (Array.isArray(res.data)) {
            users = res.data;
          } else if (res.data?.data && Array.isArray(res.data.data)) {
            users = res.data.data;
          }
          
          if (users.length > 0) {
            setAllUsers(users);
            setLoadingUsers(false);
            return;
          }
        } catch (err) {
          console.log("⚠️ [AddressBookDialog] /user/organization 실패, 다음 API 시도:", err.message);
        }
        
        try {
          // 2순위: /admin/users (관리자 API)
          let res = await http.get("/admin/users");
          let users = [];
          
          if (Array.isArray(res.data)) {
            users = res.data;
          } else if (res.data?.data && Array.isArray(res.data.data)) {
            users = res.data.data;
          }
          
          if (users.length > 0) {
            setAllUsers(users);
            setLoadingUsers(false);
            return;
          }
        } catch (err) {
          console.log("⚠️ [AddressBookDialog] /admin/users 실패, 다음 API 시도:", err.message);
        }
        
        try {
          // 3순위: /user/list
          let res = await http.get("/user/list");
          let users = [];
          
          if (Array.isArray(res.data)) {
            users = res.data;
          } else if (res.data?.data && Array.isArray(res.data.data)) {
            users = res.data.data;
          }
          
          if (users.length > 0) {
            setAllUsers(users);
            setLoadingUsers(false);
            return;
          }
        } catch (err) {
          console.log("⚠️ [AddressBookDialog] /user/list 실패, 다음 API 시도:", err.message);
        }
        
        try {
          // 4순위: /user
          let res = await http.get("/user");
          let users = [];
          
          if (Array.isArray(res.data)) {
            users = res.data;
          } else if (res.data?.data && Array.isArray(res.data.data)) {
            users = res.data.data;
          }
          
          if (users.length > 0) {
            setAllUsers(users);
            setLoadingUsers(false);
            return;
          }
        } catch (err) {
          console.log("⚠️ [AddressBookDialog] /user 실패:", err.message);
        }
        
        // 모든 API 실패
        setAllUsers([]);
        setLoadingUsers(false);
      };
      
      fetchUsers();
    }
  }, [open]);
  
  // 직급 라벨 변환 함수
  const getJobGradeLabel = (jobGrade) => {
    if (!jobGrade) return "";
    const gradeMap = {
      INTERN: "인턴",
      STAFF: "사원",
      ASSISTANT_MANAGER: "대리",
      MANAGER: "과장",
      DEPUTY_GENERAL_MANAGER: "차장",
      GENERAL_MANAGER: "부장",
      DIRECTOR: "이사",
      EXECUTIVE_DIRECTOR: "상무",
      VICE_PRESIDENT: "전무",
      PRESIDENT: "대표",
    };
    return gradeMap[jobGrade] || jobGrade;
  };
  
  // 검색 필터링
  const filteredUsers = useMemo(() => {
    if (searchTerm.trim() === "") {
      return allUsers;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return allUsers.filter((user) => {
      const nameMatch = user.name && user.name.toLowerCase().includes(searchLower);
      const emailMatch = user.email && user.email.toLowerCase().includes(searchLower);
      const jobGradeMatch = (user.jobGrade && getJobGradeLabel(user.jobGrade).toLowerCase().includes(searchLower)) ||
                           (user.positionName && user.positionName.toLowerCase().includes(searchLower));
      const deptMatch = (user.deptName || user.departmentName) && 
                       (user.deptName || user.departmentName).toLowerCase().includes(searchLower);
      return nameMatch || emailMatch || jobGradeMatch || deptMatch;
    });
  }, [allUsers, searchTerm]);
  
  // 사용자 선택/해제 핸들러
  const handleToggleUser = (user) => {
    const userId = user.userId || user.id;
    if (!userId) {
      console.error("사용자 ID가 없습니다:", user);
      return;
    }
    
    setSelectedUsers((prev) => {
      const isSelected = prev.some(u => (u.userId || u.id) === userId);
      
      if (isSelected) {
        return prev.filter(u => (u.userId || u.id) !== userId);
      } else {
        return [...prev, user];
      }
    });
  };
  
  // 선택된 사용자 제거 (Chip X 버튼)
  const handleRemoveUser = (userToRemove) => {
    const userId = userToRemove.userId || userToRemove.id;
    setSelectedUsers((prev) => prev.filter((user) => (user.userId || user.id) !== userId));
  };

  // 사용자가 선택되었는지 확인
  const isUserSelected = (user) => {
    const userId = user.userId || user.id;
    return selectedUsers.some(u => (u.userId || u.id) === userId);
  };

  // 확인 버튼 클릭 시 선택한 사용자들의 이메일 주소 반환
  const handleConfirm = () => {
    const emails = selectedUsers
      .map(user => user.email)
      .filter(email => email && email.trim() !== "");
    
    onConfirm(emails);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          주소록
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          받는 사람을 선택하세요
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, minHeight: 300, maxHeight: 500 }}>
        {/* 검색 필드 */}
        <Box sx={{ p: 2, borderBottom: "1px solid #e3e8ef" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="이름 또는 이메일로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        {/* 선택된 사용자 표시 */}
        {selectedUsers.length > 0 && (
          <Box sx={{ p: 2, borderBottom: "1px solid #e3e8ef", bgcolor: "#f8f9fa" }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              선택된 사용자 ({selectedUsers.length}명)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedUsers.map((user) => {
                const userId = user.userId || user.id;
                return (
                  <Chip
                    key={userId}
                    avatar={
                      <Avatar
                        src={
                          user.profileImageUrl && 
                          user.profileImageUrl.trim() !== '' && 
                          user.profileImageUrl.startsWith('http') 
                            ? user.profileImageUrl 
                            : undefined
                        }
                        sx={{ bgcolor: "#10c16d", width: 24, height: 24 }}
                        imgProps={{
                          onError: (e) => {
                            e.target.style.display = "none";
                          }
                        }}
                      >
                        {(!user.profileImageUrl || 
                          user.profileImageUrl.trim() === '' || 
                          !user.profileImageUrl.startsWith('http')) && 
                          (user.name?.[0]?.toUpperCase() || "?")}
                      </Avatar>
                    }
                    label={`${user.name} (${user.email})`}
                    onDelete={() => handleRemoveUser(user)}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        {/* 사용자 리스트 */}
        {loadingUsers ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <Typography color="text.secondary">
              {searchTerm ? "검색 결과가 없습니다." : "사용자가 없습니다."}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 300, overflowY: "auto" }}>
            {filteredUsers.map((user) => {
              const userId = user.userId || user.id;
              const userEmail = user.email || "";
              const isAlreadySelected = initialSelectedEmails.includes(userEmail);
              
              return (
                <ListItem
                  key={userId}
                  disablePadding
                  sx={{
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    opacity: isAlreadySelected ? 0.5 : 1,
                  }}
                >
                  <ListItemButton
                    onClick={(e) => {
                      if (e.target.type !== 'checkbox' && !e.target.closest('input[type="checkbox"]')) {
                        if (!isAlreadySelected) {
                          handleToggleUser(user);
                        }
                      }
                    }}
                    disabled={isAlreadySelected}
                    sx={{ py: 1.5, px: 2 }}
                  >
                    <Checkbox
                      checked={isUserSelected(user)}
                      disabled={isAlreadySelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (!isAlreadySelected) {
                          handleToggleUser(user);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      sx={{ mr: 1, pointerEvents: 'auto' }}
                    />
                    <ListItemAvatar>
                      <Avatar
                        src={
                          user.profileImageUrl && 
                          user.profileImageUrl.trim() !== '' && 
                          user.profileImageUrl.startsWith('http') 
                            ? user.profileImageUrl 
                            : undefined
                        }
                        sx={{ bgcolor: "#10c16d", width: 40, height: 40 }}
                        imgProps={{
                          onError: (e) => {
                            e.target.style.display = "none";
                          }
                        }}
                      >
                        {(!user.profileImageUrl || 
                          user.profileImageUrl.trim() === '' || 
                          !user.profileImageUrl.startsWith('http')) && 
                          (user.name?.[0]?.toUpperCase() || "?")}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {user.name || "이름 없음"}
                          </Typography>
                          {(user.jobGrade || user.positionName) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                bgcolor: "action.selected",
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontSize: 12,
                              }}
                            >
                              {getJobGradeLabel(user.jobGrade || user.positionName)}
                            </Typography>
                          )}
                          {(user.deptName || user.departmentName) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "primary.main",
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontSize: 12,
                              }}
                            >
                              {user.deptName || user.departmentName}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                          {user.email || "이메일 없음"}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid #e3e8ef" }}>
        <Button onClick={onClose}>취소</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={selectedUsers.length === 0}
        >
          선택 ({selectedUsers.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddressBookDialog;

