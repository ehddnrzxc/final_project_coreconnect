import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import useAuth from "../../../hooks/useAuth";

/* 로그인 보호용 라우트 */
function ProtectedRoute({ children }) {
  const { isLoggedIn, isChecking } = useAuth();
  
  // 인증 확인 중일 때는 로딩 표시
  if (isChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;