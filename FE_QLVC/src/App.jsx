import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './pages/admin/AdminLayout';
import UserPage from './pages/user/UserPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useAuth } from './contexts/AuthContext';
import './assets/App.css';
// Nếu bạn đã cài đặt react-toastify, hãy bỏ comment dòng dưới
// import { toast } from 'react-toastify';

function App() {
  const { auth } = useAuth();

  // Thiết lập listener toàn cục để xử lý lỗi xác thực
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log('Token expired:', event.detail);
      
      // Xóa token và thông tin người dùng
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // Reload trang để chuyển hướng đến trang đăng nhập
      window.location.href = '/login';
      
      // Hiển thị thông báo
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };
    
    // Đăng ký sự kiện lắng nghe
    window.addEventListener('auth-error', handleAuthError);
    
    // Hủy đăng ký khi component bị hủy
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);
  
  // Show loading state while checking authentication
  if (auth.isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            auth.isAuthenticated
              ? <Navigate to={auth.userRole === 'admin' ? '/admin' : '/'} replace />
              : <LoginPage />
          }
        />

        {/* Register Route */}
        <Route
          path="/register"
          element={
            auth.isAuthenticated
              ? <Navigate to={auth.userRole === 'admin' ? '/admin' : '/'} replace />
              : <RegisterPage />
          }
        />

        {/* User Route */}
        <Route
          path="/"
          element={
            auth.isAuthenticated
              ? <UserPage />
              : <Navigate to="/login" replace />
          }
        />
        
        {/* Admin Routes - Requires authentication with admin role */}
        <Route
          path="/admin/*"
          element={
            auth.isAuthenticated && auth.userRole === 'admin'
              ? <AdminLayout />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
