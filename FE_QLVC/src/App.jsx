import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './pages/admin/AdminLayout';
import { UserManagement } from './pages/admin/UserManagement';
import { ProductManagement } from './pages/admin/ProductManagement';
import UserPage from './pages/user/UserPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useAuth } from './contexts/AuthContext';
import './assets/App.css';

function App() {
  const { auth } = useAuth();

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

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            auth.isAuthenticated && auth.userRole === 'admin'
              ? <AdminLayout />
              : <Navigate to={auth.isAuthenticated ? '/' : '/login'} replace />
          }
        >
          <Route index element={<UserManagement />} />
          <Route path="products" element={<ProductManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
