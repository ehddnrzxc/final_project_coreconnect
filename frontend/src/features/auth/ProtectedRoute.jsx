import useAuth from "../../hooks/useAuth";

/* 로그인 보호용 라우트 */
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;