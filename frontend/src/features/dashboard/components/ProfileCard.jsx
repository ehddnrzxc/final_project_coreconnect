import React, { useState, useEffect, useContext } from "react";
import { getMyLeaveSummary } from "../../leave/api/leaveAPI";
import { getMyPendingApprovalCount, getMyReceivedApprovalCount  } from "../api/dashboardAPI";
import { Link, useOutletContext } from "react-router-dom";
import Card from "../../../components/ui/Card";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  uploadMyProfileImage,
  getMyProfileInfo,
} from "../../user/api/userAPI";
import { getMyTodaySchedules } from "../../schedule/api/scheduleAPI";
import {
  countTodayPostsByCategoryClientOnly,
  getMyDeptBoardCategoryId,
} from "../api/dashboardAPI";
import { UserProfileContext } from "../../../App";
import { jobGradeLabel } from "../../../utils/jobGradeUtils";

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [todayScheduleCount, setTodayScheduleCount] = useState(null);
  const [deptCategoryId, setDeptCategoryId] = useState(null);
  const [deptNewCount, setDeptNewCount] = useState(null);
  const [remainingLeaveDays, setRemainingLeaveDays] = useState(null);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(null);
  const [receivedApprovalCount, setReceivedApprovalCount] = useState(null);

  const { setAvatarUrl } = useOutletContext();
  const userProfile = useContext(UserProfileContext);

  const email = userProfile?.email || "";
  const displayName = userProfile?.name || "";
  const grade = userProfile?.jobGrade ? jobGradeLabel(userProfile.jobGrade) : "";
  const deptName = userProfile?.deptName || "";

  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";

  /** 오늘 일정 */
  useEffect(() => {
    (async () => {
      try {
        const list = await getMyTodaySchedules();
        setTodayScheduleCount(list.length);
        setScheduleError(null);
      } catch (err) {
        console.error("오늘 일정 조회 실패:", err);
        setTodayScheduleCount(null);
        setScheduleError("일정 정보 불러오기 실패");
      }
    })();
  }, []);

  /** 부서 카테고리 ID 로드 */
  useEffect(() => {
    (async () => {
      try {
        const id = await getMyDeptBoardCategoryId();
        setDeptCategoryId(id ?? null);
      } catch (e) {
        console.error("부서 카테고리 ID 조회 실패:", e);
        setDeptCategoryId(null); 
      }
    })();
  }, []);

  /** 남은 연차 정보 로딩 */
  useEffect(() => {
    (async () => {
      try {
        const summary = await getMyLeaveSummary();
        // 방어적으로 숫자 변환
        const days = Number(summary?.remainingAnnualLeaveDays);
        setRemainingLeaveDays(Number.isFinite(days) ? days : 0);
      } catch (e) {
        console.error("잔여 연차 로딩 실패:", e);
        setRemainingLeaveDays(null); 
      }
    })();
  }, []);

  /** 결재 대기 문서 수 로딩 */
  useEffect(() => {
    (async () => {
      try {
        const [pending, received] = await Promise.all([
          getMyPendingApprovalCount(),
          getMyReceivedApprovalCount(),
        ]);
        setPendingApprovalCount(Number.isFinite(pending) ? pending : 0);
        setReceivedApprovalCount(Number.isFinite(received) ? received : 0);
      } catch (e) {
        console.error("결재 카운트 로딩 실패:", e);
        setPendingApprovalCount(null);   
        setReceivedApprovalCount(null);
      }
    })();
  }, []);

  /** 오늘 새 글 카운트 */ 
  useEffect(() => {
    if (!deptCategoryId) {
      setDeptNewCount(0); // 부서 카테고리 없으면 0
      return;
    }
    (async () => {
      try {
        const todayCount = await countTodayPostsByCategoryClientOnly(deptCategoryId, 100, 5);
        setDeptNewCount(todayCount);
      } catch (e) {
        console.error(e);
        setDeptNewCount(null); // "-" 표기
      }
    })();
  }, [deptCategoryId]);

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

      // 업로드 후 프로필 정보 재조회
      const updatedProfile = await getMyProfileInfo();
      setAvatarUrl(updatedProfile.profileImageUrl || DEFAULT_AVATAR);
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
      event.target.value = ""; // 같은 파일 재선택 가능
    }
  };

  // 안전한 아바타 경로 계산
  const avatarUrl = userProfile?.profileImageUrl && userProfile.profileImageUrl.trim() !== "" 
    ? userProfile.profileImageUrl 
    : DEFAULT_AVATAR;

  const items = [
    {
      label: "부서 커뮤니티 오늘의 새 글",
      value: deptNewCount == null ? "-" : deptNewCount,
      highlight: Number(deptNewCount) > 0,
      to: deptCategoryId ? `/board/${deptCategoryId}?sortType=latest&scope=today` : null,
    },
    { label: "결재/합의 대기 문서", 
      value: pendingApprovalCount == null ? "-" : pendingApprovalCount,
      highlight: Number(pendingApprovalCount) > 0, 
      to: "/e-approval/pending", 
    },
    { label: "참조 대기 문서", 
      value: receivedApprovalCount == null ? "-" : receivedApprovalCount, 
      highlight: Number(receivedApprovalCount) > 0,
      to: "/e-approval/refer" 
    },
    { label: "내 잔여 연차", 
      value: remainingLeaveDays == null ? "-" : remainingLeaveDays, 
      highlight: Number(remainingLeaveDays) > 0, 
      to: "/leave" 
    },
  ];

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
      <Box
        component={Link}
        to="/calendar"
        aria-label="캘린더로 이동"
        sx={{
          textAlign: "center",
          my: 1,
          textDecoration: "none",
          color: "inherit",
          display: "block",
          '&:hover .calendar-title': { textDecoration: "underline" }, // 호버 효과(선택)
        }}
      >
        <Typography
          variant="h3"
          sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}
        >
          {todayScheduleCount === null ? "-" : todayScheduleCount}
        </Typography>
        <Typography
          className="calendar-title"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          오늘의 일정
        </Typography>

        {scheduleError && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            {scheduleError}
          </Typography>
        )}
      </Box>

      {/* 하단 리스트 */}
      <List dense sx={{ mt: 1, pt: 1, borderTop: "1px solid #e5e7eb" }}>
        {items.map(({ label, value, highlight, to }, idx) => {
          const clickable = Boolean(to);
          const Item = clickable ? ListItemButton : ListItemButton; 
          return (
            <Item
              key={idx}
              component={clickable ? Link : "div"}
              to={clickable ? to : undefined}
              disabled={!clickable}
              sx={{
                px: 0,
                py: 0.5,
                borderBottom: "1px solid #e5e7eb",
                "&:last-of-type": { borderBottom: "none" },
                opacity: clickable ? 1 : 0.6,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <ListItemText
                primary={<Typography variant="body2" color="text.secondary">{label}</Typography>}
              />
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: highlight ? "primary.main" : "#6b7280" }}
              >
                {value}
              </Typography>
            </Item>
          );
        })}
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
