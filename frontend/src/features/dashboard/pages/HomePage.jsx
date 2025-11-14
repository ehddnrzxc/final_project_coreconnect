import React from "react";
import { Container, Grid } from "@mui/material";
import AttendanceCard from "../components/AttendanceCard";
import ProfileCard from "../components/ProfileCard";
import MailListCard from "../components/MailListCard";
import QuickMenuCard from "../components/QuickMenuCard";
import RecentBoardsCard from "../components/RecentBoardsCard";
import CalendarCard from "../components/CalendarCard";
import RecentNotificationsCard from "../components/RecentNotificationsCard";

/* ─ Page ─ */
export default function Home() {
  return (
    <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
      <Grid container spacing={3}>
        {/* 프로필 카드 */}
        <Grid item xs={12} md={4}>
          <ProfileCard />
        </Grid>
        {/* 메일 리스트 */}
        <Grid item xs={12} md={4}>
          <MailListCard />
        </Grid>
        {/* 근태 */}
        <Grid item xs={12} md={4}>
          <AttendanceCard />
        </Grid>
        {/* Quick Menu */}
        <Grid item xs={12} md={4}>
          <QuickMenuCard />
        </Grid>
        {/* 전체게시판 최근글 */}
        <Grid item xs={12} md={4}>
          <RecentBoardsCard />
        </Grid>
        {/* 캘린더 */}
        <Grid item xs={12} md={4}>
          <CalendarCard />
        </Grid>
        {/* 최근 알림 */}
        <Grid item xs={12} md={4}>
          <RecentNotificationsCard />
        </Grid>
      </Grid>
    </Container>
  );
}
