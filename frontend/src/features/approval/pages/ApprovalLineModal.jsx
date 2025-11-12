import React, { useState, useEffect } from "react";
import { getOrganizationChart } from "../../user/api/userAPI";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Modal,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ApprovalTypeChip from "../components/ApprovalTypeChip";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

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
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedLine, setSelectedLine] = useState(currentLine || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDepartments, setOpenDepartments] = useState({});

  useEffect(() => {
    if (open) {
      const fetchOrgUsers = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await getOrganizationChart();
          setOrganizationUsers(res.data);
          setFilteredUsers(res.data);

          const groupedData = res.data.reduce((acc, user) => {
            const dept = user.deptName || "소속 없음";
            if (!acc[dept]) {
              acc[dept] = [];
            }
            acc[dept].push(user);
            return acc;
          }, {});
          setGroupedUsers(groupedData);

          const initialOpenState = Object.keys(groupedData).reduce((acc, dept) => {
            acc[dept] = true;
            return acc;
          }, {});
          setOpenDepartments(initialOpenState);
        } catch (error) {
          console.error("Error fetching organization chart:", error);
          setError("조직도 데이터를 불러오는 데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrgUsers();
      setSelectedLine(currentLine || []);
      setSearchTerm("");
      setOpenDepartments({});
    }
  }, [open, currentLine]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = organizationUsers.filter((user) => {
      const nameMatch =
        user.name && user.name.toLowerCase().includes(lowerSearchTerm);
      const deptMatch =
        user.deptName && user.deptName.toLowerCase().includes(lowerSearchTerm);
      return nameMatch || deptMatch;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, organizationUsers]);

  const handleToggleDepartment = (deptName) => {
    setOpenDepartments((prevOpen) => ({
      ...prevOpen,
      [deptName]: !prevOpen[deptName],
    }));
  };

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

  const handleRemoveUser = (idx) => {
    const newLine = [...selectedLine];
    newLine.splice(idx, 1);
    setSelectedLine(newLine);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newLine = [...selectedLine];
    const [movedItem] = newLine.splice(index, 1);
    newLine.splice(index - 1, 0, movedItem);
    setSelectedLine(newLine);
  };

  const handleMoveDown = (index) => {
    if (index === selectedLine.length - 1) return;
    const newLine = [...selectedLine];
    const [movedItem] = newLine.splice(index, 1);
    newLine.splice(index + 1, 0, movedItem);
    setSelectedLine(newLine);
  };

  const handleConfirm = () => {
    const sortedLine = [...selectedLine].sort((a, b) => {
      const orderA = a.type === "REFER" ? 1 : 0;
      const orderB = b.type === "REFER" ? 1 : 0;
      return orderA - orderB;
    });
    handleSubmitLine(sortedLine);
    handleClose();
  };

  const renderUserItem = (user) => (
    <ListItem key={user.userId}>
      <ListItemText
        primary={`${user.name} (${user.positionName})`}
        secondary={user.deptName}
        sx={{ flex: 1, minWidth: 0 }}
      />
      <Box sx={{ flexShrink: 0, pl: 2 }}>
        <ButtonGroup variant="outlined" size="small">
          <Button
            size="small"
            onClick={() => handleAddUser(user, "APPROVE")}
          >
            결재
          </Button>
          <Button
            size="small"
            onClick={() => handleAddUser(user, "AGREE")}
          >
            합의
          </Button>
          <Button
            size="small"
            onClick={() => handleAddUser(user, "REFER")}
          >
            참조
          </Button>
        </ButtonGroup>
      </Box>
    </ListItem>
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          결재선 지정
        </Typography>
        <Grid container spacing={2} sx={{ flex: 1, overflow: "hidden" }}>
          {/* --- 1. 왼쪽: 조직도 --- */}
          <Grid
            item
            xs={6}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Paper
              sx={{
                flex: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, flexShrink: 0 }}>
                조직도
              </Typography>
              <TextField
                fullWidth
                label="이름 또는 부서 검색"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, flexShrink: 0 }}
              />
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <List disablePadding sx={{ overflowY: "auto", flex: 1 }}>
                  {searchTerm ? (
                    // 1. 검색어가 있으면: 필터링된 목록 표시
                    filteredUsers.map(renderUserItem)
                  ) : (
                    // 2. 검색어가 없으면: 부서별 그룹 목록 표시
                    Object.keys(groupedUsers)
                      .sort()
                      .map((deptName) => {
                        const isOpen = !!openDepartments[deptName];
                        return (
                          <React.Fragment key={deptName}>
                            <ListItemButton
                              onClick={() => handleToggleDepartment(deptName)}
                            >
                              <ListItemText
                                primary={deptName}
                                primaryTypographyProps={{ fontWeight: "bold" }}
                              />
                              {isOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                              <List component="div" disablePadding sx={{ pl: 2 }}>
                                {groupedUsers[deptName].map(renderUserItem)}
                              </List>
                            </Collapse>
                          </React.Fragment>
                        );
                      })
                  )}
                </List>
              )}
            </Paper>
          </Grid>

          {/* --- 2. 오른쪽: 결재선 (스크롤 되도록 수정) --- */}
          <Grid
            item
            xs={6}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Paper
              sx={{
                flex: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, flexShrink: 0 }}>
                결재선 (총 {selectedLine.length}명)
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, flexShrink: 0 }}
              >
                * 결재/합의자는 순서대로 진행되며, 참조자는 즉시 조회합니다.
                <br />* 최종 확인 시 '참조' 유형은 맨 뒤로 정렬됩니다.
              </Typography>
              {selectedLine.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  왼쪽 조직도에서 사용자를 추가하세요.
                </Alert>
              ) : (
                <List sx={{ overflowY: "auto", flex: 1 }}>
                  {selectedLine.map((line, index) => (
                    <ListItem
                      key={line.userId}
                      sx={{ border: "1px solid #eee", mb: 1, borderRadius: 2 }}
                    >
                      <ApprovalTypeChip type={line.type} sx={{ mr: 2 }} />
                      <ListItemText
                        primary={`${line.name} (${line.positionName})`}
                        secondary={line.deptName}
                      />
                      <Box>
                        <IconButton
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUpwardIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedLine.length - 1}
                        >
                          <ArrowDownwardIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveUser(index)}
                          color="error"
                        >
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