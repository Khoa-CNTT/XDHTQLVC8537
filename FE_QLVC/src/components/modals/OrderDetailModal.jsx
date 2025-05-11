import React from 'react';
import './OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose, onApprove, onCancel }) => {
  if (!order) return null;

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
      return '0 đ';
    }
    return new Intl.NumberFormat('vi-VN', { 
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' đ';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Chờ duyệt': return 'status-badge-pending';
      case 'Đã tiếp nhận': return 'status-badge-received';
      case 'Đang lấy': return 'status-badge-picking';
      case 'Đã lấy': return 'status-badge-picked';
      case 'Lấy thất bại': return 'status-badge-failed';
      case 'Đang vận chuyển': return 'status-badge-transit';
      case 'Đang giao': return 'status-badge-delivering';
      case 'Đã giao': return 'status-badge-delivered';
      case 'Giao thất bại': return 'status-badge-failed';
      case 'Quá hạn giao': return 'status-badge-overdue';
      case 'Huỷ giao': return 'status-badge-cancelled';
      case 'Đã Hoàn': return 'status-badge-returned';
      default: return 'status-badge-default';
    }
  };

  // Handle cancel with confirmation
  const handleCancelOrder = () => {
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (reason === null) return; // User clicked Cancel
    
    if (reason.trim() === '') {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    
    onCancel(order.MaVanDon, reason);
    onClose();
  };

  return (
    <div className="order-detail-modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-detail-header">
          <h2 className="order-detail-title">Chi tiết vận đơn</h2>
          <button className="order-detail-close" onClick={onClose}>×</button>
        </div>
        
        <div className="order-detail-content">
          <div className="order-detail-section order-code-section">
            <h3>Mã vận đơn: <span className="order-code-highlight">{order.MaVanDon}</span></h3>
            <div className="order-status">
              <span className={`status-badge ${getStatusBadgeClass(order.TrangThaiDonHang)}`}>
                {order.TrangThaiDonHang || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="order-detail-grid">
            <div className="detail-card">
              <h4 className="detail-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Thông tin người gửi
              </h4>
              <div className="detail-card-content">
                <div className="detail-item">
                  <span className="detail-label">Họ tên:</span>
                  <span className="detail-value">{order.TenKhachHang || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số điện thoại:</span>
                  <span className="detail-value">{order.SDTKhachHang || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Địa chỉ:</span>
                  <span className="detail-value">{order.DiaChiKhachHang || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-card">
              <h4 className="detail-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="23 3 12 14 9 11"></polyline>
                </svg>
                Thông tin người nhận
              </h4>
              <div className="detail-card-content">
                <div className="detail-item">
                  <span className="detail-label">Họ tên:</span>
                  <span className="detail-value">{order.TenNguoiNhan || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số điện thoại:</span>
                  <span className="detail-value">{order.SDTNguoiNhan || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Địa chỉ:</span>
                  <span className="detail-value">{order.DiaChiNguoiNhan || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-card">
              <h4 className="detail-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Thông tin hàng hóa
              </h4>
              <div className="detail-card-content">
                <div className="detail-item">
                  <span className="detail-label">Tên hàng hóa:</span>
                  <span className="detail-value">{order.TenHH || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trọng lượng:</span>
                  <span className="detail-value">{order.KhoiLuong ? `${order.KhoiLuong} kg` : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kích thước:</span>
                  <span className="detail-value">{order.KichThuoc ? order.KichThuoc : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Giá trị hàng:</span>
                  <span className="detail-value">{order.GiaTriHang ? formatCurrency(order.GiaTriHang) : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-card">
              <h4 className="detail-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                Thông tin vận chuyển
              </h4>
              <div className="detail-card-content">
                <div className="detail-item">
                  <span className="detail-label">Ngày tạo đơn:</span>
                  <span className="detail-value">{formatDate(order.NgayTaoDon)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày lấy hàng:</span>
                  <span className="detail-value">{formatDate(order.NgayLayHang)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày giao hàng:</span>
                  <span className="detail-value">{formatDate(order.NgayGiaoHang)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nhân viên giao hàng:</span>
                  <span className="detail-value">{order.TenNhanVien || 'Chưa phân công'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-detail-section payment-section">
            <h4 className="section-title">Thông tin thanh toán</h4>
            <div className="payment-details">
              <div className="payment-row">
                <div className="payment-label">Phí vận chuyển:</div>
                <div className="payment-value">{formatCurrency(order.PhiGiaoHang)}</div>
              </div>
              <div className="payment-row">
                <div className="payment-label">Tiền thu hộ (COD):</div>
                <div className="payment-value cod-value">{formatCurrency(order.TienThuHo)}</div>
              </div>
              <div className="payment-row">
                <div className="payment-label">Người trả phí:</div>
                <div className="payment-value">{order.NguoiTraPhi === 'sender' ? 'Người gửi' : 'Người nhận'}</div>
              </div>
              <div className="payment-row total-row">
                <div className="payment-label">Tổng tiền:</div>
                <div className="payment-value total-value">
                  {formatCurrency((Number(order.PhiGiaoHang) || 0) + (Number(order.TienThuHo) || 0))}
                </div>
              </div>
            </div>
          </div>
          
          {order.GhiChu && (
            <div className="order-detail-section note-section">
              <h4 className="section-title">Ghi chú</h4>
              <div className="note-content">
                {order.GhiChu}
              </div>
            </div>
          )}
        </div>
        
        <div className="order-detail-actions">
          {order.TrangThaiDonHang === 'Chờ duyệt' && (
            <button 
              className="order-detail-button approve-button"
              onClick={() => { onApprove(order.MaVanDon); onClose(); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Duyệt đơn hàng
            </button>
          )}
          
          {['Chờ duyệt', 'Đã tiếp nhận'].includes(order.TrangThaiDonHang) && (
            <button 
              className="order-detail-button cancel-button"
              onClick={handleCancelOrder}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Huỷ đơn hàng
            </button>
          )}
          
          <button 
            className="order-detail-button close-button"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
