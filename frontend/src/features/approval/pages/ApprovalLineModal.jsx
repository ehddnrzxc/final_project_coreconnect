import React, { useState, useEffect } from "react";
import { getOrganizationChart } from "../../user/api/userAPI";
import { Alert, Box, Button, CircularProgress, Divider, Grid, IconButton, List, ListItem, ListItemText, Modal, Paper, TextField, Typography } from "@mui/material";
import ApprovalTypeChip from "../components/ApprovalTypeChip";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 1000,
  height: "80vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
};

function ApprovalLineModal({
  open,
  handleClose,
  currentLine,
  handleSubmitLine,
}) {
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedLine, setSelectedLine] = useState(currentLine || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      const fetchOrgUsers = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await getOrganizationChart();
          setOrganizationUsers(res.data);
          setFilteredUsers(res.data);
        } catch (error) {
          console.error("Error fetching organization chart:", error);
          setError("조직도 데이터를 불러오는 데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrgUsers();
      setSelectedLine(currentLine || []);
    }
  }, [open, currentLine]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = organizationUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerSearchTerm) ||
        (user.deptName && user.teamName.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, organizationUsers]);

  const handleAddUser = (user, type) => {
    if (selectedLine.some((line) => line.userId === user.userId)) {
      alert("이미 결재선에 포함된 사용자입니다.");
      return;
    }
    const newUser = {
      userId: user.userId,
      name: user.name,
      deptName: user.deptName,
      positionName: user.positionName,
      type: type,
    };
    setSelectedLine([...selectedLine, newUser]);
  };

  // 사용자 제거
  const handleRemoveUser = (idx) => {
    const newLine = [...selectedLine];
    newLine.splice(idx, 1);
    setSelectedLine(newLine);
  };

  // 순서 변경 (위)
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newLine = [...selectedLine];
    const [movedItem] = newLine.splice(index, 1);
    newLine.splice(index - 1, 0, movedItem);
    setSelectedLine(newLine);
  };

  // 순서 변경 (아래)
  const handleMoveDown = (index) => {
    if (index === selectedLine.length - 1) return;
    const newLine = [...selectedLine];
    const [movedItem] = newLine.splice(index, 1);
    newLine.splice(index + 1, 0, movedItem);
    setSelectedLine(newLine);
  };

  // 최종 확인
  const handleConfirm = () => {
    const sortedLine = [...selectedLine].sort((a, b) => {
      const orderA = a.type === "REFER" ? 1 : 0;
      const orderB = b.type === "REFER" ? 1 : 0;
      return orderA - orderB;
    });
    handleSubmitLine(sortedLine);
    handleClose();
  };

  return (
  <Modal open={open} onClose={handleClose}>
   <Box sx={style}>
    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
     결재선 지정
    </Typography>
    <Grid container spacing={2} sx={{ flex: 1, overflow: "hidden" }}>
     {/* --- 1. 왼쪽: 조직도 --- */}
     <Grid item xs={6} sx={{ display: "flex", flexDirection: "column" }}>
      <Paper sx={{ flex: 1, p: 2, overflowY: "auto" }}>
       <Typography variant="h6" sx={{ mb: 1 }}>
        조직도
       </Typography>
       <TextField
        fullWidth
        label="이름 또는 부서 검색"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
       />
       {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
         <CircularProgress />
        </Box>
       ) : error ? (
        <Alert severity="error">{error}</Alert>
       ) : (
        <List disablePadding>
         {filteredUsers.map((user) => (
          <ListItem
           key={user.userId}
           secondaryAction={
            <Box>
             <Button size="small" onClick={() => handleAddUser(user, "APPROVE")}>결재</Button>
             <Button size="small" onClick={() => handleAddUser(user, "AGREE")}>합의</Button>
             <Button size="small" onClick={() => handleAddUser(user, "REFER")}>참조</Button>
            </Box>
           }
           disablePadding
          >
           <ListItemText
            primary={`${user.name} (${user.positionName})`}
            secondary={user.teamName}
           />
          </ListItem>
         ))}
        </List>
       )}
      </Paper>
     </Grid>

     {/* --- 2. 오른쪽: 결재선 --- */}
     <Grid item xs={6} sx={{ display: "flex", flexDirection: "column" }}>
      <Paper sx={{ flex: 1, p: 2, overflowY: "auto" }}>
       <Typography variant="h6" sx={{ mb: 1 }}>
        결재선 (총 {selectedLine.length}명)
       </Typography>
       <Typography variant="caption" color="text.secondary">
        * 결재/합의자는 순서대로 진행되며, 참조자는 즉시 조회합니다.<br/>
        * 최종 확인 시 '참조' 유형은 맨 뒤로 정렬됩니다.
       </Typography>
       {selectedLine.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
         왼쪽 조직도에서 사용자를 추가하세요.
        </Alert>
       ) : (
        <List>
         {selectedLine.map((line, index) => (
          <ListItem
           key={line.userId}
           sx={{ border: "1px solid #eee", mb: 1, borderRadius: 2 }}
          >
           <ApprovalTypeChip
            type={line.type}
            sx={{ mr: 2 }}
           />
           <ListItemText
            primary={`${line.name} (${line.positionName})`}
            secondary={line.teamName}
           />
           <Box>
            <IconButton onClick={() => handleMoveUp(index)} disabled={index === 0}>
             <ArrowUpwardIcon />
            </IconButton>
            <IconButton onClick={() => handleMoveDown(index)} disabled={index === selectedLine.length - 1}>
             <ArrowDownwardIcon />
            </IconButton>
            <IconButton onClick={() => handleRemoveUser(index)} color="error">
             <DeleteIcon />
            </IconButton>
           </Box>
          </ListItem>
         ))}
        </List>
       )}
      </Paper>
     </Grid>
    </Grid>

    {/* --- 3. 하단 버튼 --- */}
    <Divider sx={{ my: 2 }} />
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
     <Button variant="outlined" onClick={handleClose}>
      취소
     </Button>
     <Button
      variant="contained"
      onClick={handleConfirm}
      disabled={selectedLine.length === 0}
     >
      결재선 확정
     </Button>
    </Box>
   </Box>
  </Modal>
 );
}

export default ApprovalLineModal;
