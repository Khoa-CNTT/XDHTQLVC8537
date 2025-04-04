import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './views/admin/AdminLayout';
import { UserManagement } from './views/admin/pages/UserManagement';
import { ProductManagement } from './views/admin/pages/ProductManagement';
import UserPage from './views/user/UserPage';
import LoginPage from './views/auth/LoginPage'; // Import trang đăng nhập
import RegisterPage from './views/auth/RegisterPage'; // Import trang đăng ký
import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token'); // Check if user is logged in

  return (
    <BrowserRouter>
      <Routes>
        {/* Route đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route đăng ký */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Route người dùng */}
        <Route
          path="/"
          element={isAuthenticated ? <UserPage /> : <Navigate to="/login" replace />}
        />

        {/* Route admin */}
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<UserManagement />} />
          <Route path="products" element={<ProductManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
