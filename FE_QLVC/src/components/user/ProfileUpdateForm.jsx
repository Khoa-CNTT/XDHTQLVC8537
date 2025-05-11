import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './ProfileUpdateForm.css';

const ProfileUpdateForm = ({ user, onUpdateSuccess }) => {
    // State để hiển thị/ẩn form cập nhật
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    
    // State để lưu trữ thông tin form
    const [formData, setFormData] = useState({
        Ten_KH: user?.HoTen || '',
        DiaChi: user?.DiaChi || '',
        SDT: user?.SDT || '',
    });

    // State cho form mật khẩu
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // State để theo dõi trạng thái loading, lỗi, và thành công
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Xử lý khi người dùng thay đổi input thông tin cá nhân
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Xử lý khi người dùng thay đổi input mật khẩu
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm({
            ...passwordForm,
            [name]: value,
        });
    };

    // Gửi form cập nhật thông tin cá nhân
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            // Kiểm tra số điện thoại hợp lệ
            const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(formData.SDT)) {
                throw new Error('Số điện thoại không hợp lệ');
            }

            // Kiểm tra tên không bỏ trống
            if (!formData.Ten_KH.trim()) {
                throw new Error('Tên không được để trống');
            }            // Gọi API cập nhật thông tin
            await authService.updateCustomerProfile(user.ID_KH, formData);
            setSuccess('Cập nhật thông tin thành công!');
            
            // Thông báo cho component cha biết đã cập nhật thành công
            if (onUpdateSuccess) {
                onUpdateSuccess({
                    ...user,
                    HoTen: formData.Ten_KH,
                    DiaChi: formData.DiaChi,
                    SDT: formData.SDT
                });
            }
            
            // Đóng form sau khi cập nhật thành công
            setTimeout(() => {
                setShowProfileForm(false);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    // Gửi form đổi mật khẩu
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);
        setPasswordLoading(true);

        try {
            // Kiểm tra mật khẩu mới phải có ít nhất 6 ký tự
            if (passwordForm.newPassword.length < 6) {
                throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
            }

            // Kiểm tra mật khẩu xác nhận
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                throw new Error('Mật khẩu xác nhận không khớp');
            }

            // Gọi API đổi mật khẩu
            await authService.updatePassword(user.ID_TK, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });            setPasswordSuccess('Đổi mật khẩu thành công!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            
            // Đóng form sau khi đổi mật khẩu thành công
            setTimeout(() => {
                setShowPasswordForm(false);
            }, 1500);
        } catch (err) {
            setPasswordError(err.message || 'Đã xảy ra lỗi khi đổi mật khẩu');
        } finally {
            setPasswordLoading(false);
        }
    };    return (
        <div className="profile-update-container">
            <div className="profile-form-section">
                <div className="profile-form-header">
                    <h3>Cập nhật thông tin cá nhân</h3>
                    <button 
                        type="button" 
                        className="profile-toggle-btn"
                        onClick={() => setShowProfileForm(!showProfileForm)}
                    >
                        {showProfileForm ? 'Ẩn biểu mẫu' : 'Cập nhật thông tin'}
                    </button>
                </div>
                {error && <div className="profile-error-message">{error}</div>}
                {success && <div className="profile-success-message">{success}</div>}
                
                {showProfileForm && (
                    <form onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                            <label htmlFor="Ten_KH">Họ tên:</label>
                            <input
                                type="text"
                                id="Ten_KH"
                                name="Ten_KH"
                                value={formData.Ten_KH}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="SDT">Số điện thoại:</label>
                            <input
                                type="tel"
                                id="SDT"
                                name="SDT"
                                value={formData.SDT}
                                onChange={handleInputChange}
                                required
                                pattern="(84|0[3|5|7|8|9])+([0-9]{8})\b"
                                title="Vui lòng nhập số điện thoại hợp lệ (VD: 0912345678)"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="DiaChi">Địa chỉ:</label>
                            <input
                                type="text"
                                id="DiaChi"
                                name="DiaChi"
                                value={formData.DiaChi}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <button type="submit" className="profile-update-btn" disabled={loading}>
                            {loading ? 'Đang cập nhật...' : 'Lưu thông tin'}
                        </button>
                    </form>
                )}
            </div>

            <div className="profile-form-section">
                <div className="profile-form-header">
                    <h3>Đổi mật khẩu</h3>
                    <button 
                        type="button" 
                        className="profile-toggle-btn"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                        {showPasswordForm ? 'Ẩn biểu mẫu' : 'Đổi mật khẩu'}
                    </button>
                </div>
                {passwordError && <div className="profile-error-message">{passwordError}</div>}
                {passwordSuccess && <div className="profile-success-message">{passwordSuccess}</div>}
                
                {showPasswordForm && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label htmlFor="currentPassword">Mật khẩu hiện tại:</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">Mật khẩu mới:</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength="6"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <button type="submit" className="profile-update-btn" disabled={passwordLoading}>
                            {passwordLoading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfileUpdateForm;
