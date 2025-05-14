import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./pages/admin/AdminLayout";
import UserPage from "./pages/user/UserPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import { useAuth } from "./hooks/useAuth";
import socketService from "./services/socketService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/App.css";

// Import staff page if available, if not UserPage will handle staff view conditionally
import StaffPage from "./pages/staff/StaffPage";

function App() {
  const { auth } = useAuth();

  // Thiết lập listener toàn cục để xử lý lỗi xác thực
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log("Token expired:", event.detail);

      // Xóa token và thông tin người dùng
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      // Ngắt kết nối socket trước khi đăng xuất
      socketService.disconnect();

      // Reload trang để chuyển hướng đến trang đăng nhập
      window.location.href = "/login";

      // Hiển thị thông báo
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    };

    // Đăng ký sự kiện lắng nghe
    window.addEventListener("auth-error", handleAuthError);

    // Hủy đăng ký khi component bị hủy
    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, []);

  // Kết nối socket khi đã xác thực
  useEffect(() => {
    if (auth.isAuthenticated && auth.userId) {
      // Kết nối socket với thông tin người dùng
      socketService.connect(auth.userId, auth.userRole);

      // Đăng ký các lắng nghe sự kiện
      const unsubNewOrder = socketService.onNewOrder((data) => {
        console.log("Đơn hàng mới:", data);
        // Xử lý cập nhật UI nếu cần
      });

      const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
        console.log("Đơn hàng được tiếp nhận:", data);
        // Xử lý cập nhật UI nếu cần
      });

      return () => {
        // Hủy đăng ký các lắng nghe khi unmount
        unsubNewOrder();
        unsubOrderAccepted();

        // Ngắt kết nối socket khi người dùng đăng xuất
        if (!auth.isAuthenticated) {
          socketService.disconnect();
        }
      };
    } else {
      // Ngắt kết nối nếu không còn xác thực
      socketService.disconnect();
    }
  }, [auth.isAuthenticated, auth.userId, auth.userRole]);

  // Show loading state while checking authentication
  if (auth.isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Helper function to determine redirect path based on user role
  const getRedirectPath = () => {
    switch (auth.userRole) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      default:
        return "/user";
    }
  };

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
      />
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            auth.isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Register Route */}
        <Route
          path="/register"
          element={
            auth.isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* Forgot Password Route */}
        <Route
          path="/forgotpassword"
          element={
            auth.isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <ForgotPasswordPage />
            )
          }
        />

        {/* User Route - Customer role */}
        <Route
          path="/user/*"
          element={
            auth.isAuthenticated ? (
              auth.userRole === "user" ? (
                <UserPage />
              ) : (
                <Navigate to={getRedirectPath()} replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Staff Route - Staff role */}
        <Route
          path="/staff/*"
          element={
            auth.isAuthenticated ? (
              auth.userRole === "staff" ? (
                <StaffPage />
              ) : (
                <Navigate to={getRedirectPath()} replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes - Admin role */}
        <Route
          path="/admin/*"
          element={
            auth.isAuthenticated && auth.userRole === "admin" ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Root route - Redirects based on role */}
        <Route
          path="/"
          element={
            auth.isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all redirect to appropriate route based on role or to login */}
        <Route
          path="*"
          element={
            auth.isAuthenticated ? (
              <Navigate to={getRedirectPath()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
