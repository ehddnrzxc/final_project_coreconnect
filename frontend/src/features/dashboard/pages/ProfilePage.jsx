import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../../../components/ui/Card";
import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";
import { getMyProfileImage, uploadMyProfileImage } from "../../user/api/userAPI";

const ProfilePage = () => {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const email = storedUser.email || "";
  const displayName = storedUser.name || "";
  const grade = storedUser.jobGrade;
  const deptName = storedUser.departmentName;

  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";
  const { setAvatarUrl } = useOutletContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 파일 선택 -> 즉시 업로드
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일을 선택해주세요.");
      event.target.value = "";
      return;
    }
    if (!email) {
      setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // 업로드 실행
      await uploadMyProfileImage(file);

      // 업로드 후 서버 URL 재조회
      const newUrl = await getMyProfileImage();
      setAvatarUrl(newUrl);

      // 새로고침 대비 저장(원본 URL 저장)
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, imageUrl: newUrl || "" })
      );
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
      event.target.value = ""; // 같은 파일 재선택 가능
    }
  };

  // 안전한 아바타 경로 계산
  const avatarUrl =
    storedUser.imageUrl && storedUser.imageUrl.trim() !== ""
      ? storedUser.imageUrl 
      : DEFAULT_AVATAR;

  return (
    <Card>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "110px 1fr",
          columnGap: 2,
          alignItems: "center",
          mb: 1.5,
        }}
      >
        {/* 아바타 + 변경 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            component="img"
            src={avatarUrl}
            alt="프로필 이미지"
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e5e7eb",
              boxShadow: "0 1px 2px rgba(0,0,0,.06)",
            }}
          />
          <Box
            component="label"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              fontSize: 13,
              color: "#6b7280",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {loading ? "업로드 중..." : "프로필 사진 변경"}
            </Typography>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
              disabled={loading}
            />
          </Box>
        </Box>

        {/* 이름 / 부서 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="h6" fontWeight={700}>
            {displayName} {grade}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {deptName}
          </Typography>
        </Box>
      </Box>

      {/* 오늘 일정 */}
      <Box sx={{ textAlign: "center", my: 1 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}
        >
          1
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          오늘의 일정
        </Typography>
      </Box>

      {/* 하단 리스트 */}
      <List dense sx={{ mt: 1, pt: 1, borderTop: "1px solid #e5e7eb" }}>
        {[
          ["내 커뮤니티 새글", "0", false],
          ["내 예약/대여 현황", "0", false],
          ["참여할 설문", "1", true],
          ["작성할 보고", "14", true],
          ["결재할 문서", "1", true],
          ["결재 수신 문서", "0", false],
          ["내 잔여 연차", "5d", true],
        ].map(([label, value, highlight], idx) => (
          <ListItem
            key={idx}
            sx={{
              px: 0,
              py: 0.5,
              borderBottom: "1px solid #e5e7eb",
              "&:last-of-type": { borderBottom: "none" },
            }}
            secondaryAction={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: highlight ? "primary.main" : "#6b7280",
                }}
              >
                {value}
              </Typography>
            }
          >
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 1, whiteSpace: "pre-line" }}
        >
          {error}
        </Typography>
      )}
    </Card>
  );
};

export default ProfilePage;
