import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Component để xử lý lỗi xác thực và chuyển hướng người dùng
const AuthErrorHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Hàm xử lý sự kiện 'auth-error'
    const handleAuthError = (event) => {
      console.log('Auth error detected:', event.detail);
      
      // Chuyển hướng đến trang đăng nhập
      navigate('/login');
      
      // Hiển thị thông báo nếu có thư viện thông báo
      if (window.toast) {
        window.toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    };
    
    // Đăng ký sự kiện lắng nghe
    window.addEventListener('auth-error', handleAuthError);
    
    // Hủy đăng ký khi component bị hủy
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [navigate]);
  
  // Component này không render gì cả
  return null;
};

export default AuthErrorHandler;
