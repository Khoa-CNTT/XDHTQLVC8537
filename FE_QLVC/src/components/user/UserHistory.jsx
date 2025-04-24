import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import './UserHistory.css';

const UserHistory = ({ userOrders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filter orders based on search term and status filter
    const filteredOrders = userOrders.filter(order => {
        const matchesSearch = 
            order.MaVanDon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.TenHH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.TenNguoiNhan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.Ten_NN && order.Ten_NN.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || 
            (order.TrangThaiDonHang?.toLowerCase() === statusFilter.replace(/-/g, ' '));

        return matchesSearch && matchesStatus;
    });

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
        
        // Log action for analytics (optional)
        console.log(`Viewing details for order: ${order.MaVanDon}`);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Status options for filter dropdown
    const statusOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'đang-chờ-xử-lý', label: 'Đang chờ xử lý' },
        { value: 'đã-tiếp-nhận', label: 'Đã tiếp nhận' },
        { value: 'đang-vận-chuyển', label: 'Đang vận chuyển' },
        { value: 'đã-giao', label: 'Đã giao' },
        { value: 'giao-thất-bại', label: 'Giao thất bại' },
        { value: 'huỷ-giao', label: 'Huỷ giao' }
    ];

    return (
        <div className="order-history-container">
            <h2 className="order-history-main-title">Lịch sử đơn hàng</h2>
            
            {userOrders.length === 0 ? (
                <div className="no-orders-message">
                    <img 
                        src="/assets/images/empty-box.png" 
                        alt="Không có đơn hàng" 
                        className="empty-orders-image"
                        onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/4076/4076432.png"}
                    />
                    <p>Bạn chưa có đơn hàng nào</p>
                    <p className="create-order-prompt">Tạo đơn hàng mới để bắt đầu</p>
                </div>
            ) : (
                <>
                    <div className="order-filter">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm theo mã vận đơn, tên hàng hoá, người nhận..." 
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="search-button">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                        <div className="filter-dropdown">
                            <select 
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Mã vận đơn</th>
                                    <th>Sản phẩm</th>
                                    <th>Người nhận</th>
                                    <th>Địa chỉ</th>
                                    <th>Trạng thái</th>
                                    <th>Phí giao hàng</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <tr key={order.ID_DH} className="order-row">
                                            <td className="order-code">
                                                {order.MaVanDon}
                                                <div className="order-date-mobile">
                                                    {new Date(order.NgayTaoDon).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="order-product">{order.TenHH}</td>
                                            <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                            <td className="order-address" title={order.DiaChiNN}>
                                                {order.DiaChiNN}
                                            </td>
                                            <td>
                                                <span className={`order-status status-${order.TrangThaiDonHang?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                                                    {order.TrangThaiDonHang || 'Chưa xác định'}
                                                </span>
                                            </td>
                                            <td className="order-fee">{formatCurrency(order.PhiGiaoHang || 0)}</td>
                                            <td className="order-date">
                                                {new Date(order.NgayTaoDon).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="order-actions">
                                                <button 
                                                    className="action-btn details-btn" 
                                                    title="Xem chi tiết đơn hàng"
                                                    onClick={() => handleViewDetails(order)}
                                                    aria-label="Xem chi tiết đơn hàng"
                                                >
                                                    <span className="action-btn-icon details-icon">
                                                        <i className="fas fa-info-circle"></i>
                                                    </span>
                                                    <span className="action-tooltip">Chi tiết</span>
                                                </button>
                                                <button 
                                                    className="action-btn track-btn" 
                                                    title="Theo dõi vị trí đơn hàng"
                                                    disabled={['Đã giao', 'Giao thất bại', 'Huỷ giao'].includes(order.TrangThaiDonHang)}
                                                    aria-label="Theo dõi vị trí đơn hàng"
                                                >
                                                    <span className="action-btn-icon track-icon">
                                                        <i className="fas fa-route"></i>
                                                    </span>
                                                    <span className="action-tooltip">Theo dõi</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="no-results">
                                            <div className="no-results-message">
                                                <i className="fas fa-search"></i>
                                                <p>Không tìm thấy đơn hàng phù hợp</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredOrders.length > 0 && (
                        <div className="pagination">
                            <button className="pagination-btn prev-btn" disabled>
                                <i className="fas fa-chevron-left"></i> Trước
                            </button>
                            <div className="pagination-pages">
                                <button className="pagination-page active">1</button>
                            </div>
                            <button className="pagination-btn next-btn" disabled>
                                Sau <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Order Details Modal - Enhanced version */}
            {isModalOpen && selectedOrder && (
                <div className="order-modal-overlay" onClick={handleCloseModal}>
                    <div className="order-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="order-modal-header">
                            <h3>
                                <i className="fas fa-info-circle modal-header-icon"></i>
                                Chi tiết đơn hàng #{selectedOrder.MaVanDon}
                            </h3>
                            <button className="modal-close-btn" onClick={handleCloseModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        {/* Status timeline */}
                        <div className="order-status-timeline">
                            <div className={`timeline-step ${['Đang chờ xử lý', 'Đã tiếp nhận', 'Đang vận chuyển', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div className="timeline-label">Đang chờ xử lý</div>
                            </div>
                            <div className={`timeline-step ${['Đã tiếp nhận', 'Đang vận chuyển', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-clipboard-check"></i>
                                </div>
                                <div className="timeline-label">Đã tiếp nhận</div>
                            </div>
                            <div className={`timeline-step ${['Đang vận chuyển', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-truck"></i>
                                </div>
                                <div className="timeline-label">Đang vận chuyển</div>
                            </div>
                            <div className={`timeline-step ${['Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <div className="timeline-label">Đã giao</div>
                            </div>
                            {selectedOrder.TrangThaiDonHang === 'Giao thất bại' && (
                                <div className="timeline-step failed active">
                                    <div className="timeline-icon">
                                        <i className="fas fa-times-circle"></i>
                                    </div>
                                    <div className="timeline-label">Giao thất bại</div>
                                </div>
                            )}
                            {selectedOrder.TrangThaiDonHang === 'Huỷ giao' && (
                                <div className="timeline-step cancelled active">
                                    <div className="timeline-icon">
                                        <i className="fas fa-ban"></i>
                                    </div>
                                    <div className="timeline-label">Huỷ giao</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="order-modal-body">
                            {/* Thông tin khách hàng */}
                            <div className="order-detail-section">
                                <h4><i className="fas fa-user"></i> Thông tin khách hàng</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Tên khách hàng:</span>
                                        <span className="detail-value">{selectedOrder.TenKhachHang || selectedOrder.Ten_KH || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Số điện thoại:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-phone-alt detail-icon"></i>
                                            {/* Ưu tiên các trường phổ biến nhất, nếu không có thì lấy trường tiếp theo */}
                                            {selectedOrder.SDT || selectedOrder.SDT_KH || selectedOrder.SdtKhachHang || selectedOrder.SdtKH ||  'Không có dữ liệu'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Địa chỉ:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-map-marker-alt detail-icon"></i>
                                            {selectedOrder.DiaChiKH || selectedOrder.DiaChi || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Thông tin người nhận */}
                            <div className="order-detail-section">
                                <h4><i className="fas fa-user-friends"></i> Thông tin người nhận</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Tên người nhận:</span>
                                        <span className="detail-value">{selectedOrder.TenNguoiNhan || selectedOrder.Ten_NN || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Số điện thoại:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-phone-alt detail-icon"></i>
                                            {selectedOrder.SdtNguoiNhan || selectedOrder.Sdt_NN || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Địa chỉ:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-map-marker-alt detail-icon"></i>
                                            {selectedOrder.DiaChiNN || selectedOrder.DiaChi_NN || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-detail-section">
                                <h4><i className="fas fa-info-circle"></i> Thông tin đơn hàng</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Mã vận đơn:</span>
                                        <span className="detail-value order-code">{selectedOrder.MaVanDon}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Trạng thái:</span>
                                        <span className={`detail-value order-status status-${selectedOrder.TrangThaiDonHang?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                                            {selectedOrder.TrangThaiDonHang || 'Chưa xác định'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Ngày tạo:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-calendar-alt detail-icon"></i> 
                                            {new Date(selectedOrder.NgayTaoDon).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phí giao hàng:</span>
                                        <span className="detail-value shipping-fee">
                                            <i className="fas fa-money-bill-wave detail-icon"></i> 
                                            {formatCurrency(selectedOrder.PhiGiaoHang || 0)}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Ngày giao dự kiến:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-calendar-day detail-icon"></i> 
                                            {selectedOrder.NgayGiaoDuKien ? new Date(selectedOrder.NgayGiaoDuKien).toLocaleDateString('vi-VN') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="order-detail-section">
                                <h4><i className="fas fa-box"></i> Thông tin sản phẩm</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Tên sản phẩm:</span>
                                        <span className="detail-value product-name">{selectedOrder.TenHH}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Số lượng:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-layer-group detail-icon"></i> 
                                            {selectedOrder.SoLuong || 1}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Trọng lượng:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-weight-hanging detail-icon"></i> 
                                            {selectedOrder.TrongLuong || 'N/A'} kg
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Thu hộ (COD):</span>
                                        <span className="detail-value cod-amount">
                                            <i className="fas fa-hand-holding-usd detail-icon"></i> 
                                            {formatCurrency(selectedOrder.TienThuHo || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.GhiChu && (
                                <div className="order-detail-section">
                                    <h4><i className="fas fa-sticky-note"></i> Ghi chú</h4>
                                    <div className="order-notes">
                                        <i className="fas fa-quote-left notes-quote-icon"></i>
                                        <p>{selectedOrder.GhiChu}</p>
                                        <i className="fas fa-quote-right notes-quote-icon right"></i>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="order-modal-footer">
                            <button className="modal-close-button" onClick={handleCloseModal}>
                                <i className="fas fa-times"></i> Đóng
                            </button>
                            {!['Đã giao', 'Giao thất bại', 'Huỷ giao'].includes(selectedOrder.TrangThaiDonHang) && (
                                <button className="modal-track-button">
                                    <i className="fas fa-map-marker-alt"></i> Theo dõi đơn hàng
                                </button>
                            )}
                            <button className="modal-print-button" onClick={() => window.print()}>
                                <i className="fas fa-print"></i> In đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserHistory;
