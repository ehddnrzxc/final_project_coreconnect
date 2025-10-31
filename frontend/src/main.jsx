import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserCreateForm from "./components/admin/UserCreateForm";
import AdminRoute from "./components/admin/AdminRoute";
import useAuth from "./hooks/useAuth";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* 로그인 보호용 라우트 */
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/* 전체 라우트 구조 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // 공통 레이아웃
    children: [
      {
        path: "home",
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users/create",
        element: (
          <AdminRoute>
            <UserCreateForm />
          </AdminRoute>
        ),
      },
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <div>404 Not Found</div>,
  },
]);

/* 렌더링 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);