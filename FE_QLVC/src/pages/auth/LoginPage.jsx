import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
// Import the image
import thongImg from '../../assets/thong.jpg';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/login', {
                Email: email,
                Matkhau: password,
            });

            if (response.data && response.data.success && response.data.data) {
                // Use the login function from auth context
                login(response.data.data);

                // Navigate based on role
                if (response.data.data.Role === 'admin') {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Đăng nhập thất bại');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left" style={{
                    backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(30, 64, 175, 0.8)), url(${thongImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="login-logo">
                        <h2 className="text-[#ffffff] text-4xl font-bold mb-4">QLVC</h2>
                        <h2 className="text-[#ffffff] text-2xl">
                            Hệ thống quản lý vận chuyển giúp bạn theo dõi và quản lý hàng hóa một cách hiệu quả
                        </h2>
                    </div>
                </div>

                <div className="login-form-container">
                    <div className="login-form-box">
                        {error && <div className="message error-message">{error}</div>}

                        <form onSubmit={handleLogin} className="login-form">
                            <input
                                type="email"
                                className="login-input"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>

                        <a href="#" className="forgot-password">
                            Quên mật khẩu?
                        </a>

                        <div className="login-divider"></div>

                        <div className="text-center">
                            <a href="/register" className="create-account-button">
                                Tạo tài khoản mới
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;