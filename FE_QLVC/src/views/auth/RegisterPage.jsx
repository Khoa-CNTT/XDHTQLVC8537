import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            console.log('Registering with data:', { Email: email, Matkhau: password, SDT: phone, Role: role });

            // Validate input
            if (!email || !password || !phone) {
                setError('Vui lòng điền đầy đủ thông tin');
                return;
            }

            // Make API call
            const response = await axios.post('http://localhost:8080/register', {
                Email: email,
                Matkhau: password,
                SDT: phone,
                Role: role,
            });

            console.log('Register response:', response.data);

            // Handle success
            if (response.status === 201) {
                setSuccess('Đăng ký thành công! Hãy đăng nhập.');
                setError('');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            console.error('Register error:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Đăng ký thất bại');
            setSuccess('');
        }
    };

    return (
        <div className="register-container">
            <div className="register-content">
                <div className="register-left">
                    <div className="register-logo">
                        <h2 className="text-[#ffffff] text-4xl font-bold mb-4">
                            QLVC
                        </h2>
                        <h2 className="text-[#ffffff] text-2xl">
                            Hệ thống quản lý vận chuyển giúp bạn theo dõi và quản lý hàng hóa một cách hiệu quả
                        </h2>
                    </div>
                </div>

                <div className="register-form-container">
                    <div className="register-form-box">
                        {error && <div className="message error-message">{error}</div>}
                        {success && <div className="message success-message">{success}</div>}

                        <form onSubmit={handleRegister} className="register-form">
                            <input
                                type="email"
                                className="register-input"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="register-input"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                className="register-input"
                                placeholder="Số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="register-input"
                            >
                                <option value="user">Người dùng</option>
                                <option value="admin">Nhân Viên</option>
                            </select>
                            <button type="submit" className="register-button">
                                Đăng Ký
                            </button>
                        </form>

                        <div className="register-divider"></div>
                        <div className="text-center">
                            <a href="/login" className="login-link">
                                Đã có tài khoản? Đăng nhập
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;