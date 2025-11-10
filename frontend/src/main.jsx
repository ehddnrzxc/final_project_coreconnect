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
import ApprovalLayout from "./features/approval/pages/ApprovalLayout";
import AdminHome from "./features/admin/components/AdminHome";
import UserListPage from "./features/admin/components/UserListPage";
import ChatHomePage from "./features/chat/pages/ChatHomePage";
import ChatLayout from "./features/chat/pages/ChatLayout";
import EmailLayout from "./features/email/pages/EmailLayout";
import TemplateAdminCreate from "./features/admin/components/TemplateAdminCreate";
import BoardLayout from "./features/board/pages/BoardLayout";
import BoardListPage from "./features/board/pages/BoardListPage";
import BoardDetailPage from "./features/board/pages/BoardDetailPage";
import BoardWritePage from "./features/board/pages/BoardWritePage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import CalendarPage from "./features/schedule/pages/CalendarPage";
import AdminCategoryPage from "./features/board/pages/AdminCategoryPage";
import MailInboxPage from "./features/email/pages/MailInboxPage";
import MailWritePage from "./features/email/pages/MailWritePage";
import MailTrashPage from "./features/email/pages/MailTrashPage";
import PasswordResetPage from "./features/admin/components/PasswordResetPage";
import NewDocumentPage from "./features/approval/pages/NewDocumentPage";
import MailSentBoxPage from "./features/email/pages/MailSentBoxPage";
import MailDetailPage from "./features/email/pages/MailDetailPage";
import DocumentDetailPage from "./features/approval/pages/DocumentDetailPage";
//import LeavePage from "./features/leave/LeavePage";
import DraftBoxPage from "./features/email/pages/DraftBoxPage";


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
        path: "email",
        element: (
          <ProtectedRoute>
            <EmailLayout/>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <MailInboxPage /> },
          { path: "write", element: <MailWritePage /> },
          { path: "trash", element: <MailTrashPage /> },
          { path: "sent", element: <MailSentBoxPage/>},
          { path: ":emailId", element: <MailDetailPage /> },
          { path: "draftbox", element: <DraftBoxPage /> }, // ★ 임시보관함 추가
        ]
      },
      {
        path: "e-approval",
        element: (
          <ProtectedRoute>
            <ApprovalLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ApprovalHomePage /> }, // 결재홈
          { path: "new/:templateId", element: <NewDocumentPage /> }, // 새 결제 진행
          { path: "doc/:documentId", element: <DocumentDetailPage /> },
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
        path: "leave",
        element: (
          <ProtectedRoute>
            {/* <LeavePage />*/}
          </ProtectedRoute>
        ),
      },
      {
        path: "board",
        element: (
          <ProtectedRoute>
            <BoardLayout />
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
          { path: "board/category", element: <AdminCategoryPage /> },
          { path: "password-reset-requests", element: <PasswordResetPage /> },
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