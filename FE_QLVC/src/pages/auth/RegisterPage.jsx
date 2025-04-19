import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Import the image
import thongImg from '../../assets/thong.jpg';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        Email: '',
        MatKhau: '',
        SDT: '',
        Role: 'user',
        HoTen: '',
        DiaChi: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Validate input
            if (!formData.Email || !formData.MatKhau || !formData.SDT || !formData.HoTen || !formData.DiaChi) {
                setError('Vui lòng điền đầy đủ thông tin');
                return;
            }

            // Make API call
            const response = await axios.post('http://localhost:8080/api/register', formData);

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
                <div className="register-left" style={{
                    backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(30, 64, 175, 0.8)), url(${thongImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="register-logo">
                        <h2 className="text-[#ffffff] text-4xl font-bold mb-4">QLVC</h2>
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
                                name="Email"
                                className="register-input"
                                placeholder="Email"
                                value={formData.Email}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="password"
                                name="MatKhau"
                                className="register-input"
                                placeholder="Mật khẩu"
                                value={formData.MatKhau}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="HoTen"
                                className="register-input"
                                placeholder="Họ và tên"
                                value={formData.HoTen}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="SDT"
                                className="register-input"
                                placeholder="Số điện thoại"
                                value={formData.SDT}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="DiaChi"
                                className="register-input"
                                placeholder="Địa chỉ"
                                value={formData.DiaChi}
                                onChange={handleChange}
                                required
                            />
                            <select
                                name="Role"
                                value={formData.Role}
                                onChange={handleChange}
                                className="register-input"
                            >
                                <option value="user">Người dùng</option>
                                <option value="staff">Nhân viên</option>

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