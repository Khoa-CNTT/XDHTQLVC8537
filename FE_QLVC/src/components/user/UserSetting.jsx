import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './UserSetting.css';

const UserSetting = ({ user, userOrders }) => {
    const [activeSettingsTab, setActiveSettingsTab] = useState('reports');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [reportType, setReportType] = useState('all');
    const [reportData, setReportData] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        orderUpdates: true,
        promotions: false,
        emailNotifications: true,
        smsNotifications: false
    });

    const handleSettingsTabClick = (tab) => {
        setActiveSettingsTab(tab);
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleGenerateReport = () => {
        if (!user || !user.ID_KH) {
            toast.error('Không thể tạo báo cáo: thiếu thông tin người dùng');
            return;
        }
        
        setGeneratingReport(true);
        
        try {
            // Filter orders based on date range and report type
            const filteredOrders = userOrders.filter(order => {
                const orderDate = new Date(order.NgayTaoDon);
                const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date(0);
                const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
                
                // Apply type filter
                if (reportType !== 'all') {
                    if (reportType === 'completed' && order.TrangThaiDonHang !== 'Đã giao') {
                        return false;
                    }
                    if (reportType === 'processing' && order.TrangThaiDonHang === 'Đã giao') {
                        return false;
                    }
                }
                
                return orderDate >= start && orderDate <= end;
            });
            
            // Calculate statistics
            const totalOrders = filteredOrders.length;
            const totalShipping = filteredOrders.reduce((sum, order) => sum + (order.PhiGiaoHang || 0), 0);
            const completedOrders = filteredOrders.filter(order => order.TrangThaiDonHang === 'Đã giao').length;
            const pendingOrders = totalOrders - completedOrders;
            
            setReportData({
                orders: filteredOrders,
                stats: {
                    totalOrders,
                    totalShipping,
                    completedOrders,
                    pendingOrders
                }
            });
            
            setTimeout(() => {
                // Scroll to results
                document.getElementById('report-results')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            toast.success('Báo cáo đã được tạo thành công');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Không thể tạo báo cáo. Vui lòng thử lại sau.');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleSaveNotificationSettings = () => {
        // In a real app, you would save these settings to the server
        toast.success('Đã lưu cài đặt thông báo!');
    };

    const handleExportReport = (format) => {
        // In a real app, this would generate and download a file
        toast.info(`Đang xuất báo cáo dạng ${format.toUpperCase()}...`);
        
        setTimeout(() => {
            toast.success(`Đã xuất báo cáo dạng ${format.toUpperCase()}!`);
        }, 1500);
    };

    return (
        <div className="settings-container">
            <h2 className="settings-main-title">Cài đặt hệ thống</h2>
            
            <div className="settings-tabs">
                <button 
                    className={`settings-tab ${activeSettingsTab === 'reports' ? 'active' : ''}`}
                    onClick={() => handleSettingsTabClick('reports')}
                >
                    <i className="fas fa-chart-bar"></i> Báo cáo đơn hàng
                </button>
                <button 
                    className={`settings-tab ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => handleSettingsTabClick('notifications')}
                >
                    <i className="fas fa-bell"></i> Cài đặt thông báo
                </button>
                <button 
                    className={`settings-tab ${activeSettingsTab === 'security' ? 'active' : ''}`}
                    onClick={() => handleSettingsTabClick('security')}
                >
                    <i className="fas fa-shield-alt"></i> Bảo mật tài khoản
                </button>
                <button 
                    className={`settings-tab ${activeSettingsTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => handleSettingsTabClick('appearance')}
                >
                    <i className="fas fa-palette"></i> Giao diện
                </button>
            </div>
            
            <div className="settings-content">
                {/* Order Reports Tab */}
                {activeSettingsTab === 'reports' && (
                    <div className="settings-panel">
                        <h3 className="settings-panel-title">Báo cáo đơn hàng</h3>
                        <p className="settings-panel-description">
                            Tạo báo cáo chi tiết về các đơn hàng của bạn trong khoảng thời gian xác định.
                        </p>
                        
                        <div className="report-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="startDate">Từ ngày:</label>
                                    <input 
                                        type="date" 
                                        id="startDate"
                                        name="startDate"
                                        value={dateRange.startDate}
                                        onChange={handleDateRangeChange}
                                        className="form-input"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="endDate">Đến ngày:</label>
                                    <input 
                                        type="date" 
                                        id="endDate"
                                        name="endDate"
                                        value={dateRange.endDate}
                                        onChange={handleDateRangeChange}
                                        className="form-input"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="reportType">Loại đơn hàng:</label>
                                    <select 
                                        id="reportType"
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="all">Tất cả đơn hàng</option>
                                        <option value="completed">Đơn hàng đã hoàn thành</option>
                                        <option value="processing">Đơn hàng đang xử lý</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button 
                                className="generate-report-btn"
                                onClick={handleGenerateReport}
                                disabled={generatingReport}
                            >
                                {generatingReport ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Đang tạo báo cáo...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-file-alt"></i> Tạo báo cáo
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {reportData && (
                            <div className="report-results" id="report-results">
                                <div className="report-summary">
                                    <h4>Tổng quan báo cáo</h4>
                                    <div className="report-stats">
                                        <div className="stat-card">
                                            <div className="stat-value">{reportData.stats.totalOrders}</div>
                                            <div className="stat-label">Tổng đơn hàng</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{reportData.stats.completedOrders}</div>
                                            <div className="stat-label">Đơn đã hoàn thành</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{reportData.stats.pendingOrders}</div>
                                            <div className="stat-label">Đơn đang xử lý</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{formatCurrency(reportData.stats.totalShipping)}</div>
                                            <div className="stat-label">Tổng phí giao hàng</div>
                                        </div>
                                    </div>
                                    
                                    <div className="report-actions">
                                        <button 
                                            className="report-action-btn"
                                            onClick={() => handleExportReport('pdf')}
                                        >
                                            <i className="fas fa-file-pdf"></i> Xuất PDF
                                        </button>
                                        <button 
                                            className="report-action-btn"
                                            onClick={() => handleExportReport('excel')}
                                        >
                                            <i className="fas fa-file-excel"></i> Xuất Excel
                                        </button>
                                        <button 
                                            className="report-action-btn"
                                            onClick={() => window.print()}
                                        >
                                            <i className="fas fa-print"></i> In báo cáo
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="report-orders">
                                    <h4>Chi tiết đơn hàng</h4>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Mã vận đơn</th>
                                                <th>Ngày tạo</th>
                                                <th>Sản phẩm</th>
                                                <th>Người nhận</th>
                                                <th>Phí giao hàng</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.orders.length > 0 ? (
                                                reportData.orders.map(order => (
                                                    <tr key={order.ID_DH}>
                                                        <td>{order.MaVanDon}</td>
                                                        <td>{new Date(order.NgayTaoDon).toLocaleDateString('vi-VN')}</td>
                                                        <td>{order.TenHH}</td>
                                                        <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                                        <td>{formatCurrency(order.PhiGiaoHang || 0)}</td>
                                                        <td>
                                                            <span className={`order-status status-${order.TrangThaiDonHang?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                                                                {order.TrangThaiDonHang || 'Chưa xác định'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="no-data">Không tìm thấy đơn hàng phù hợp tiêu chí báo cáo</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Notification Settings Tab */}
                {activeSettingsTab === 'notifications' && (
                    <div className="settings-panel">
                        <h3 className="settings-panel-title">Cài đặt thông báo</h3>
                        <p className="settings-panel-description">
                            Tùy chỉnh cách bạn nhận thông báo từ hệ thống.
                        </p>
                        
                        <div className="notification-settings">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Thông báo cập nhật đơn hàng</h4>
                                    <p>Nhận thông báo khi đơn hàng của bạn được cập nhật trạng thái</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        name="orderUpdates"
                                        checked={notificationSettings.orderUpdates}
                                        onChange={handleNotificationChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Thông báo khuyến mãi và ưu đãi</h4>
                                    <p>Nhận thông báo về các chương trình khuyến mãi và ưu đãi mới</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        name="promotions"
                                        checked={notificationSettings.promotions}
                                        onChange={handleNotificationChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <h4 className="notification-channel-title">Kênh thông báo</h4>
                            
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Thông báo qua email</h4>
                                    <p>Gửi thông báo đến địa chỉ email của bạn</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        name="emailNotifications"
                                        checked={notificationSettings.emailNotifications}
                                        onChange={handleNotificationChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div className="setting-item">
                                <div className="setting-info">
                                    <h4>Thông báo qua SMS</h4>
                                    <p>Gửi tin nhắn SMS đến số điện thoại của bạn</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        name="smsNotifications"
                                        checked={notificationSettings.smsNotifications}
                                        onChange={handleNotificationChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <button 
                                className="save-settings-btn"
                                onClick={handleSaveNotificationSettings}
                            >
                                <i className="fas fa-save"></i> Lưu cài đặt
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Security Tab */}
                {activeSettingsTab === 'security' && (
                    <div className="settings-panel">
                        <h3 className="settings-panel-title">Bảo mật tài khoản</h3>
                        <p className="settings-panel-description">
                            Thiết lập các tùy chọn bảo mật để bảo vệ tài khoản của bạn.
                        </p>
                        
                        <div className="security-info">
                            <div className="security-item">
                                <div className="security-header">
                                    <h4>Thông tin đăng nhập</h4>
                                    <span className="last-updated">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="security-details">
                                    <p><strong>Email đăng nhập:</strong> {user?.Email || 'Không có dữ liệu'}</p>
                                    <p><strong>Mật khẩu:</strong> ••••••••</p>
                                    <button className="change-password-btn">
                                        <i className="fas fa-key"></i> Đổi mật khẩu
                                    </button>
                                </div>
                            </div>
                            
                            <div className="security-item">
                                <div className="security-header">
                                    <h4>Lịch sử đăng nhập</h4>
                                </div>
                                <div className="login-history">
                                    <div className="login-entry">
                                        <div className="device-info">
                                            <i className="fas fa-desktop"></i>
                                            <div>
                                                <p className="device-name">Windows PC - Chrome</p>
                                                <p className="ip-address">IP: 192.168.1.1</p>
                                            </div>
                                        </div>
                                        <div className="login-time">
                                            <p>{new Date().toLocaleDateString('vi-VN')}</p>
                                            <p>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="login-entry">
                                        <div className="device-info">
                                            <i className="fas fa-mobile-alt"></i>
                                            <div>
                                                <p className="device-name">Android - Chrome Mobile</p>
                                                <p className="ip-address">IP: 192.168.1.5</p>
                                            </div>
                                        </div>
                                        <div className="login-time">
                                            <p>{new Date(Date.now() - 86400000).toLocaleDateString('vi-VN')}</p>
                                            <p>09:20</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="security-item">
                                <div className="security-header">
                                    <h4>Xác thực hai lớp</h4>
                                </div>
                                <div className="two-factor">
                                    <p>Bảo vệ tài khoản của bạn với một lớp bảo mật thêm bằng cách xác thực bằng số điện thoại.</p>
                                    <label className="toggle-switch">
                                        <input type="checkbox" />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <div className="setting-status">Chưa kích hoạt</div>
                                    <button className="setup-2fa-btn">
                                        <i className="fas fa-shield-alt"></i> Thiết lập xác thực
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Appearance Tab */}
                {activeSettingsTab === 'appearance' && (
                    <div className="settings-panel">
                        <h3 className="settings-panel-title">Tùy chỉnh giao diện</h3>
                        <p className="settings-panel-description">
                            Tùy chỉnh giao diện người dùng theo sở thích của bạn.
                        </p>
                        
                        <div className="appearance-settings">
                            <div className="appearance-section">
                                <h4>Chế độ màn hình</h4>
                                <div className="theme-options">
                                    <div className="theme-option">
                                        <input type="radio" id="theme-light" name="theme" value="light" defaultChecked />
                                        <label htmlFor="theme-light" className="theme-card">
                                            <div className="theme-preview light-theme-preview"></div>
                                            <div className="theme-name">Sáng</div>
                                        </label>
                                    </div>
                                    <div className="theme-option">
                                        <input type="radio" id="theme-dark" name="theme" value="dark" />
                                        <label htmlFor="theme-dark" className="theme-card">
                                            <div className="theme-preview dark-theme-preview"></div>
                                            <div className="theme-name">Tối</div>
                                        </label>
                                    </div>
                                    <div className="theme-option">
                                        <input type="radio" id="theme-auto" name="theme" value="auto" />
                                        <label htmlFor="theme-auto" className="theme-card">
                                            <div className="theme-preview auto-theme-preview"></div>
                                            <div className="theme-name">Tự động</div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="appearance-section">
                                <h4>Màu sắc chủ đề</h4>
                                <div className="color-options">
                                    <div className="color-option">
                                        <input type="radio" id="color-blue" name="color" value="blue" defaultChecked />
                                        <label htmlFor="color-blue" className="color-ball blue"></label>
                                    </div>
                                    <div className="color-option">
                                        <input type="radio" id="color-green" name="color" value="green" />
                                        <label htmlFor="color-green" className="color-ball green"></label>
                                    </div>
                                    <div className="color-option">
                                        <input type="radio" id="color-purple" name="color" value="purple" />
                                        <label htmlFor="color-purple" className="color-ball purple"></label>
                                    </div>
                                    <div className="color-option">
                                        <input type="radio" id="color-red" name="color" value="red" />
                                        <label htmlFor="color-red" className="color-ball red"></label>
                                    </div>
                                    <div className="color-option">
                                        <input type="radio" id="color-orange" name="color" value="orange" />
                                        <label htmlFor="color-orange" className="color-ball orange"></label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="appearance-section">
                                <h4>Cỡ chữ</h4>
                                <div className="font-size-slider">
                                    <span>A</span>
                                    <input type="range" min="12" max="20" defaultValue="16" className="slider" />
                                    <span>A</span>
                                </div>
                            </div>
                            
                            <div className="appearance-buttons">
                                <button className="save-appearance-btn">
                                    <i className="fas fa-save"></i> Lưu cài đặt
                                </button>
                                <button className="reset-appearance-btn">
                                    <i className="fas fa-undo"></i> Khôi phục mặc định
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSetting;
