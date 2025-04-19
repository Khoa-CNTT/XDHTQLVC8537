import React, { useState } from 'react';
import '../modals/UserEditModal.css'; // Reusing the same CSS

const UserAddModal = ({ isOpen, onClose, onSubmit }) => {  const [userData, setUserData] = useState({
    HoTen: '',
    Email: '',
    SDT: '',
    DiaChi: '',
    Role: 'user',
    MatKhau: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(userData);
      onClose();      // Reset form
      setUserData({
        HoTen: '',
        Email: '',
        SDT: '',
        DiaChi: '',
        Role: 'user',
        MatKhau: ''
      });
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2 className="edit-modal-title">Thêm tài khoản mới</h2>
          <button className="edit-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {error && (
          <div className="edit-error-message">
            {error}
          </div>
        )}
        
        <form className="edit-user-form" onSubmit={handleSubmit}>
          <div className="edit-form-row">
            <div className="edit-form-group">
              <label htmlFor="HoTen">Họ và tên</label>
              <input
                type="text"
                id="HoTen"
                name="HoTen"
                value={userData.HoTen}
                onChange={handleChange}
                required
                placeholder="Nhập họ và tên"
              />
            </div>
            
            <div className="edit-form-group">
              <label htmlFor="Email">Email</label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={userData.Email}
                onChange={handleChange}
                required
                placeholder="Nhập email"
              />
            </div>
          </div>
          
          <div className="edit-form-row">
            <div className="edit-form-group">
              <label htmlFor="SDT">Số điện thoại</label>
              <input
                type="tel"
                id="SDT"
                name="SDT"
                value={userData.SDT}
                onChange={handleChange}
                required
                placeholder="Nhập số điện thoại"
              />
            </div>
            
            <div className="edit-form-group">
              <label htmlFor="Role">Vai trò</label>
              <select
                id="Role"
                name="Role"
                value={userData.Role}
                onChange={handleChange}
                required
              >
                <option value="admin">Quản trị viên</option>
                <option value="staff">Nhân viên</option>
                <option value="user">Khách hàng</option>
              </select>
            </div>
          </div>
          
          <div className="edit-form-group full-width">
            <label htmlFor="DiaChi">Địa chỉ</label>
            <textarea
              id="DiaChi"
              name="DiaChi"
              value={userData.DiaChi}
              onChange={handleChange}
              required
              placeholder="Nhập địa chỉ"
              rows="3"
            />
          </div>
            <div className="edit-form-row">
            <div className="edit-form-group">
              <label htmlFor="MatKhau">Mật khẩu</label>
              <input
                type="password"
                id="MatKhau"
                name="MatKhau"
                value={userData.MatKhau}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>
          </div>
          
          <div className="edit-form-actions">
            <button 
              type="button" 
              className="edit-cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button 
              type="submit" 
              className="edit-save-button"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserAddModal;
