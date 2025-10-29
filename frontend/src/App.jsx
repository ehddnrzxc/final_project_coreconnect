import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserCreateForm from "./components/admin/UserCreateForm";
import AdminRoute from "./components/admin/AdminRoute";

const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const { isLoggedIn, setIsLoggedIn, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <HomePage onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route
        path="/admin/users/create"
        element={
          <AdminRoute>
            <UserCreateForm />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
