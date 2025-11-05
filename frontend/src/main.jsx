import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./features/auth/pages/LoginPage";
import HomePage from "./features/dashboard/pages/HomePage";
import UserCreateForm from "./features/admin/components/UserCreateForm";
import AdminRoute from "./features/admin/components/AdminRoute";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ApprovalHomePage from "./features/approval/pages/ApprovalHomePage";
import ApprovalWritePage from "./features/approval/pages/ApprovalWritePage";
import ApprovalLayout from "./features/approval/pages/ApprovalLayout";
import AdminHome from "./features/admin/components/AdminHome";
import UserListPage from "./features/admin/components/UserListPage";
import ChatHomePage from "./features/chat/pages/ChatHomePage";
import ChatLayout from "./features/chat/pages/ChatLayout";
import ApprovalDetailPage from "./features/approval/pages/ApprovalDetailPage";
import TemplateAdminCreate from "./features/admin/components/TemplateAdminCreate";
import BoardLayout from "./features/board/pages/BoardLayout";
import BoardListPage from "./features/board/pages/BoardListPage";
import BoardDetailPage from "./features/board/pages/BoardDetailPage";
import BoardWritePage from "./features/board/pages/BoardWritePage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import CalendarPage from "./features/schedule/pages/CalendarPage";
import AdminCategoryPage from "./features/board/pages/AdminCategoryPage";

/* 전체 라우트 구조 */
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
        path: "chat",
        element: (
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ChatHomePage /> },
          // 나중에 /chat/:roomId, /chat/new 등 추가 가능
        ],
      },
      {
        path: "e-approval",
        element: (
          <ProtectedRoute>
            <ApprovalLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ApprovalHomePage /> },
          { path: "new", element: <ApprovalWritePage /> },
          { path: "forms", element: <div>자주 쓰는 양식 페이지</div> },
          { path: "pending", element: <div>결재 대기 문서 목록</div> },
          { path: "doc/:documentId", element: <ApprovalDetailPage /> },
        ],
      },

      {
        path: "calendar",
        element: (
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "board",
        element: (
          <ProtectedRoute>
            <BoardLayout /> {/* 좌측 카테고리 + Outlet */}
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <BoardListPage /> },
          { path: ":categoryId", element: <BoardListPage /> },
          { path: "detail/:boardId", element: <BoardDetailPage /> },
          { path: "new", element: <BoardWritePage /> },
          { path: "edit/:boardId", element: <BoardWritePage /> },
        ],
      },

      {
        path: "admin",
        element: <AdminRoute />,
        children: [
          { path: "", element: <AdminHome /> },
          { path: "users/create", element: <UserCreateForm /> },
          { path: "users", element: <UserListPage /> },
          { path: "templates/create", element: <TemplateAdminCreate /> },

          // 추가된 관리자 전용 카테고리 관리 페이지
          {
            path: "board/category",
            element: <AdminCategoryPage />,
          },
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