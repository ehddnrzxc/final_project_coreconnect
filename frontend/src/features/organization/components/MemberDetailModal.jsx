import { Dialog, DialogContent, IconButton, Typography, Avatar, Paper, Box, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useNavigate } from "react-router-dom";


const MemberDetailModal = ({ open, member, onClose, onCloseDrawer }) => {

  const navigate = useNavigate();

  if (!member) return null; // 선택된 구성원이 없으면 모달 표시하지 않음

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 6px 25px rgba(0,0,0,0.15)",
        },
      }}
    >

      {/* 상단 그라데이션 영역 */}
      <Box
        sx={{
          height: 120,
          background: "linear-gradient(135deg, #5AA9E6 0%, #7FC8F8 100%)",
          position: "relative",
        }}
      >
        {/* 메일쓰기 버튼 */}
        <Button
          startIcon={<MailOutlineIcon />}
          onClick={() => {
            navigate("/email/write", { state: { mailTo: member.email } });
            if (onCloseDrawer) onCloseDrawer(); // drawer 닫기
            onClose();                          // modal 닫기
          }}
          sx={{
            position: "absolute",
            left: 16,
            top: 16,
            bgcolor: "rgba(255,255,255,0.9)",
            borderRadius: "50px",
            fontSize: 13,
            fontWeight: 600,
            px: 2,
            py: 0.6,
            boxShadow: 1,
            "&:hover": { bgcolor: "white" },
          }}
        >
          메일쓰기
        </Button>

        {/* 닫기 버튼 */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 아바타 + 기본 정보 섹션 */}
      <DialogContent sx={{ textAlign: "center", mt: -6 }}>
        <Avatar
          src={member.profileUrl}
          sx={{
            width: 100,
            height: 100,
            mx: "auto",
            mb: 2,
            bgcolor: "#e0e0e0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />

        {/* 이름 + 직급 */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          {member.name}{" "}
          <span style={{ fontWeight: 500, color: "#666" }}>
            {member.jobGrade || ""}
          </span>
        </Typography>

        {/* 부서 경로 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {member.deptPath}
        </Typography>

        {/* 상세 정보 카드 */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e5e5e5",
            borderRadius: 3,
            p: 2,
            textAlign: "left",
            mb: 2,
            bgcolor: "#fafafa",
          }}
        >
          <InfoRow label="회사" value="코어커넥트" />
          <InfoRow label="부서" value={member.deptName} />
          <InfoRow label="직급" value={member.jobGrade || "-"} />
          <InfoRow label="이메일" value={member.email} />
          <InfoRow label="휴대전화" value={member.phone || "-"} />
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

/** 한 줄 상세정보 */
const InfoRow = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontSize: 15 }}>
      {value}
    </Typography>
  </Box>
);

export default MemberDetailModal;
