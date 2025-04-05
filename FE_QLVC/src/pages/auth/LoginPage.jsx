import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log('Attempting login with:', { Email: email, Matkhau: password });
            const response = await axios.post('http://localhost:8080/login', {
                Email: email,
                Matkhau: password,
            });
            console.log('Login response:', response.data);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
        } catch (err) {
            console.error('Login error:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left">
                    <div className="login-logo">
                        <h2 className="text-[#ffffff] text-4xl font-bold mb-4">
                            QLVC
                        </h2>
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
                            />
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="login-button">
                                Đăng nhập
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