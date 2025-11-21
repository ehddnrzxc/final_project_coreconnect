import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Avatar,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { getDetailProfileInfo, updateDetailProfileInfo } from "../../../../features/user/api/userAPI";

export default function ProfileDetailView({
  avatarUrl,
  userName,
  displayedDept,
  displayedJobGrade,
  displayedEmail,
  userProfile,
  userEmail,
  onBack,
}) {
  const theme = useTheme();
  const [detailProfileInfo, setDetailProfileInfo] = useState(null);
  const [isEditingDetailProfile, setIsEditingDetailProfile] = useState(false);
  const [detailProfileFormData, setDetailProfileFormData] = useState({
    companyName: "",
    directPhone: "",
    fax: "",
    address: "",
    birthday: "",
    bio: "",
    externalEmail: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [errors, setErrors] = useState({});

  // 프로필 정보 로드
  useEffect(() => {
    const loadDetailProfileInfo = async () => {
      try {
        const info = await getDetailProfileInfo();
        setDetailProfileInfo(info);
        // 폼 데이터 초기화
        setDetailProfileFormData({
          companyName: info?.companyName || "",
          directPhone: info?.directPhone || "",
          fax: info?.fax || "",
          address: info?.address || "",
          birthday: info?.birthday || "",
          bio: info?.bio || "",
          externalEmail: info?.externalEmail || "",
        });
      } catch (error) {
        console.error("프로필 정보 로드 실패:", error);
      }
    };
    if (userEmail) {
      loadDetailProfileInfo();
    }
  }, [userEmail]);

  // 입력값 검증
  const validateForm = () => {
    const newErrors = {};
    
    if (detailProfileFormData.companyName && detailProfileFormData.companyName.length > 100) {
      newErrors.companyName = "회사이름은 100자 이하여야 합니다.";
    }
    
    if (detailProfileFormData.directPhone && detailProfileFormData.directPhone.length > 20) {
      newErrors.directPhone = "직통전화는 20자 이하여야 합니다.";
    }
    
    if (detailProfileFormData.fax && detailProfileFormData.fax.length > 20) {
      newErrors.fax = "팩스는 20자 이하여야 합니다.";
    }
    
    if (detailProfileFormData.address && detailProfileFormData.address.length > 500) {
      newErrors.address = "주소는 500자 이하여야 합니다.";
    }
    
    if (detailProfileFormData.externalEmail && detailProfileFormData.externalEmail.length > 255) {
      newErrors.externalEmail = "외부 메일은 255자 이하여야 합니다.";
    }
    
    // 이메일 형식 검증
    if (detailProfileFormData.externalEmail && detailProfileFormData.externalEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(detailProfileFormData.externalEmail)) {
        newErrors.externalEmail = "올바른 이메일 형식이 아닙니다.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 입력값 변경 핸들러
  const handleFieldChange = (field, value) => {
    setDetailProfileFormData({ ...detailProfileFormData, [field]: value });
    // 실시간 검증
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // 프로필 정보 수정 핸들러
  const handleSaveDetailProfile = async () => {
    // 검증 실패 시 저장하지 않음
    if (!validateForm()) {
      return;
    }
    
    try {
      setSavingProfile(true);
      await updateDetailProfileInfo({
        companyName: detailProfileFormData.companyName || null,
        directPhone: detailProfileFormData.directPhone || null,
        fax: detailProfileFormData.fax || null,
        address: detailProfileFormData.address || null,
        birthday: detailProfileFormData.birthday || null,
        bio: detailProfileFormData.bio || null,
        externalEmail: detailProfileFormData.externalEmail || null,
      });
      // 프로필 정보 다시 로드
      const info = await getDetailProfileInfo();
      setDetailProfileInfo(info);
      setIsEditingDetailProfile(false);
      setErrors({});
    } catch (error) {
      console.error("프로필 정보 저장 실패:", error);
      // 에러 메시지 표시
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: "프로필 정보 저장에 실패했습니다." });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEdit = () => {
    setIsEditingDetailProfile(true);
  };

  const handleCancel = () => {
    setIsEditingDetailProfile(false);
    // 폼 데이터 초기화
    setDetailProfileFormData({
      companyName: detailProfileInfo?.companyName || "",
      directPhone: detailProfileInfo?.directPhone || "",
      fax: detailProfileInfo?.fax || "",
      address: detailProfileInfo?.address || "",
      birthday: detailProfileInfo?.birthday || "",
      bio: detailProfileInfo?.bio || "",
      externalEmail: detailProfileInfo?.externalEmail || "",
    });
    setErrors({});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton
          size="small"
          onClick={onBack}
          sx={{ border: `1px solid ${theme.palette.divider}` }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5">내 프로필 관리</Typography>
        {!isEditingDetailProfile && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleEdit}
            sx={{ ml: "auto" }}
          >
            수정
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          p: 3,
          maxWidth: 540,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={avatarUrl} alt={userName} sx={{ width: 72, height: 72 }} />
          <Box>
            <Typography variant="h6">{userName || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {displayedDept} · {displayedJobGrade || "직급 정보 없음"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayedEmail}
            </Typography>
          </Box>
        </Stack>

        {isEditingDetailProfile ? (
          <Stack spacing={2}>
            {errors.submit && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {errors.submit}
              </Typography>
            )}
            <TextField
              label="회사이름"
              value={detailProfileFormData.companyName}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              size="small"
              fullWidth
              inputProps={{ maxLength: 100 }}
              error={!!errors.companyName}
              helperText={errors.companyName || `${detailProfileFormData.companyName.length}/100`}
            />
            <TextField
              label="직통전화"
              value={detailProfileFormData.directPhone}
              onChange={(e) => handleFieldChange("directPhone", e.target.value)}
              size="small"
              fullWidth
              inputProps={{ maxLength: 20 }}
              error={!!errors.directPhone}
              helperText={errors.directPhone || `${detailProfileFormData.directPhone.length}/20`}
            />
            <TextField
              label="팩스"
              value={detailProfileFormData.fax}
              onChange={(e) => handleFieldChange("fax", e.target.value)}
              size="small"
              fullWidth
              inputProps={{ maxLength: 20 }}
              error={!!errors.fax}
              helperText={errors.fax || `${detailProfileFormData.fax.length}/20`}
            />
            <TextField
              label="주소"
              value={detailProfileFormData.address}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              inputProps={{ maxLength: 500 }}
              error={!!errors.address}
              helperText={errors.address || `${detailProfileFormData.address.length}/500`}
            />
            <TextField
              label="생일"
              type="date"
              value={detailProfileFormData.birthday}
              onChange={(e) => handleFieldChange("birthday", e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="외부 메일"
              type="email"
              value={detailProfileFormData.externalEmail}
              onChange={(e) => handleFieldChange("externalEmail", e.target.value)}
              size="small"
              fullWidth
              inputProps={{ maxLength: 255 }}
              error={!!errors.externalEmail}
              helperText={errors.externalEmail || `${detailProfileFormData.externalEmail.length}/255`}
            />
            <TextField
              label="자기소개"
              value={detailProfileFormData.bio}
              onChange={(e) => handleFieldChange("bio", e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={4}
              helperText={`${detailProfileFormData.bio.length}자`}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={savingProfile}>
                취소
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveDetailProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "저장 중..." : "저장"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {[
              { label: "회사이름", value: detailProfileInfo?.companyName || "-" },
              { label: "사번", value: userProfile?.employeeNumber || "-" },
              { label: "아이디/이메일", value: `${userProfile?.email || "-"}` },
              { label: "직책·부서", value: displayedDept },
              { label: "직급", value: displayedJobGrade || "-" },
              { label: "휴대전화", value: userProfile?.phone || "-" },
              { label: "직통전화", value: detailProfileInfo?.directPhone || "-" },
              { label: "팩스", value: detailProfileInfo?.fax || "-" },
              { label: "주소", value: detailProfileInfo?.address || "-" },
              { label: "생일", value: detailProfileInfo?.birthday || "-" },
              { label: "외부 메일", value: detailProfileInfo?.externalEmail || "-" },
              { label: "자기소개", value: detailProfileInfo?.bio || "-" },
            ].map((item) => (
              <Box key={item.label} sx={{ display: "flex", gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 110 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-word" }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

