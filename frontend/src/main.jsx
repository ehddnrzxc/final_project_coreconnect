import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserCreateForm from "./components/admin/UserCreateForm";
import AdminRoute from "./components/admin/AdminRoute";
import useAuth from "./hooks/useAuth";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ApprovalHomePage from "./pages/ApprovalHomePage";
import ApprovalWritePage from "./pages/ApprovalWritePage";
import ApprovalLayout from "./pages/ApprovalLayout";
import AdminHome from "./components/admin/AdminHome";
import UserListPage from "./components/admin/UserListPage";
import ChatHomePage from "./pages/ChatHomePage";
import ChatLayout from "./pages/ChatLayout";
import ApprovalDetailPage from "./pages/ApprovalDetailPage";
import TemplateAdminCreate from "./components/admin/TemplateAdminCreate";

/* 로그인 보호용 라우트 */
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/* 전체 라우트 구조 */

// createBrowserRouter 사용: 객체 기반. 라우트 구조를 JSON처럼 데이터로 정의 
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App.jsx: 공통 레이아웃
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
        path: "chat", // chat 진입시
        element: (
          <ProtectedRoute>
            <ChatLayout/>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true, // chat 경로에 접속 시 기본적으로 이 컴포넌트로 렌더링
            element: <ChatHomePage/>
          },
          // 나중에 /chat/:roomId, /chat/new 등 추가 가능
        ] 


      },
      {
        path: "e-approval",
        element: (
          <ProtectedRoute>
            <ApprovalLayout /> {/* 2단 레이아웃 껍데기 */}
          </ProtectedRoute>
        ),
        children: [
          {
            index: true, // /e-approval 접속 시 기본으로 보일 페이지
            element: <ApprovalHomePage />,
          },
          {
            path: "new", // /e-approval/new (새 결재 진행)
            element: <ApprovalWritePage />,
          },
          {
            path: "forms", // /e-approval/forms (자주 쓰는 양식)
            element: <div>자주 쓰는 양식 페이지</div>, // 임시
          },
          {
            path: "pending", // /e-approval/pending (결재 대기 문서)
            element: <div>결재 대기 문서 목록</div>, // 임시
          },
          {
            path: "doc/:documentId", // /e-approval/doc/123 (결재 상세)
            element: <ApprovalDetailPage />,
          },
        ],
      },
      {
        path: "admin",
        element: <AdminRoute />,
        children: [
          { path: "", element: <AdminHome /> },
          { path: "users/create", element: <UserCreateForm /> },
          { path: "users", element: <UserListPage /> },
          { path: "templates/create", element: <TemplateAdminCreate /> }
        ],
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
