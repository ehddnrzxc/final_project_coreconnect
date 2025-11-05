import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Container } from "@mui/material";
import LoginForm from "./LoginForm";
import useAuth from "../../../hooks/useAuth";
import logo from "../../../assets/coreconnect-logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/home");
  };

  return (
    <Box sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#ffffff",   
    }}>
      <Container
        maxWidth="xs"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {/* 상단 로고 + 제목 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 4,
          }}
        >
          <Box component="img" src={logo} alt="logo" sx={{ height: 100 }} />
          <Typography variant="h3" fontWeight={500}>
            코어커넥트
          </Typography>
        </Box>

        {/* 로그인 폼 */}
        <Box sx={{ width: "100%", px: 3 }}>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </Box>
      </Container>
    </Box>
  );
}
