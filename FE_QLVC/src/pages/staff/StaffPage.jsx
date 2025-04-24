import React, { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../services/orderService.js'; 
import { authService } from '../../services/authService.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StaffView from '../../components/staff/StaffView';
import StaffNotification from '../../components/staff/StaffNotification';
import socketService from '../../services/socketService';
import { notificationService } from '../../services/notificationService';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/formatters';
import './StaffPage.css';

const StaffPage = () => {
    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const [activeItem, setActiveItem] = useState('main');
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]); // Staff orders
    const [pendingOrders, setPendingOrders] = useState([]); // For pending orders
    const [deliveredOrders, setDeliveredOrders] = useState([]); // Đơn đã giao thành công
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Đếm số thông báo chưa đọc
    const unreadCount = notifications.filter(n => n.DaDoc === 0).length;

    // Memoize fetchUserData to prevent recreation on every render
    const fetchUserData = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch staff details 
            const specificUserData = await authService.getNhanVienByTK(userId);

            if (!specificUserData) {
                throw new Error('Không thể tải thông tin chi tiết nhân viên.');
            }

            // Combine base auth info with specific details
            const combinedUserData = {
                ID_TK: userId,
                Role: 'staff',
                ...specificUserData, // Spread fetched details
                // Ensure HoTen is set correctly
                HoTen: specificUserData.Ten_NV,
            };
            setUser(combinedUserData);

            // Fetch additional data
            const empPromise = authService.getNhanVien();
            const ordersPromise = orderService.getOrdersByStaff(combinedUserData.ID_NV);
            const pendingOrdersPromise = orderService.getPendingOrders();

            // Wait for all promises
            const [empData, ordersData, pendingOrdersData] = await Promise.all([
                empPromise,
                ordersPromise,
                pendingOrdersPromise
            ]);
            
            setEmployees(empData || []);
            setOrders(ordersData?.filter(o => o.TrangThaiDonHang !== 'Đã giao') || []);
            setPendingOrders(pendingOrdersData || []);
            setDeliveredOrders(ordersData?.filter(o => o.TrangThaiDonHang === 'Đã giao') || []);

        } catch (err) {
            console.error('Error fetching staff page data:', err);
            setError(`Lỗi khi tải dữ liệu: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch notifications for staff
    const fetchNotifications = useCallback(async (staffId) => {
        try {
            const noti = await notificationService.getStaffNotifications(staffId);
            // Debug log để kiểm tra dữ liệu trả về từ API
            console.log('API notificationService.getStaffNotifications:', noti);
            // Nếu trả về có .data là mảng thì lấy .data, nếu không thì lấy trực tiếp
            const notificationsArr = Array.isArray(noti?.data) ? noti.data : (Array.isArray(noti) ? noti : []);
            setNotifications(notificationsArr);
            // Log để kiểm tra dữ liệu set vào state
            console.log('Set notifications:', notificationsArr);
        } catch (err) {
            console.error('Lỗi khi lấy thông báo:', err);
        }
    }, []);

    // Gọi fetchNotifications khi user đã có thông tin
    useEffect(() => {
        if (user && user.ID_NV) {
            fetchNotifications(user.ID_NV);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        // Check auth state from context
        if (!auth.isLoading) {
            if (!auth.isAuthenticated || !auth.userId || auth.userRole !== 'staff') {
                navigate('/login', { replace: true });
            } else {
                // Fetch data if authenticated
                fetchUserData(auth.userId);
            }
        }
    }, [auth.isLoading, auth.isAuthenticated, auth.userId, auth.userRole, navigate, fetchUserData]);
    
    // Lắng nghe sự kiện socket.io để cập nhật dữ liệu theo thời gian thực
    useEffect(() => {
        if (!auth.isAuthenticated || !user) return;
        
        // Đăng ký lắng nghe sự kiện đơn hàng mới
        const unsubNewOrder = socketService.onNewOrder((data) => {
            console.log('Nhận được sự kiện đơn hàng mới:', data);
            
            // Cập nhật danh sách đơn hàng chờ xử lý
            orderService.getPendingOrders()
                .then(updatedPendingOrders => {
                    setPendingOrders(updatedPendingOrders || []);
                    toast.info('Có đơn hàng mới đang chờ xử lý!');
                })
                .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng chờ:', error));
        });
        
        // Đăng ký lắng nghe sự kiện đơn hàng được tiếp nhận
        const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
            console.log('Nhận được sự kiện đơn hàng được tiếp nhận:', data);
            
            if (user.ID_NV) {
                // Cập nhật danh sách đơn hàng của nhân viên
                orderService.getOrdersByStaff(user.ID_NV)
                    .then(updatedOrders => {
                        setOrders(updatedOrders || []);
                    })
                    .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng:', error));
                
                // Cập nhật danh sách đơn hàng chờ
                orderService.getPendingOrders()
                    .then(updatedPendingOrders => {
                        setPendingOrders(updatedPendingOrders || []);
                    })
                    .catch(error => console.error('Lỗi khi cập nhật đơn hàng chờ:', error));
            }
        });
        
        // Đăng ký lắng nghe sự kiện thay đổi trạng thái đơn hàng
        const unsubOrderStatusChanged = socketService.onOrderStatusChanged((data) => {
            console.log('Nhận được sự kiện trạng thái đơn hàng thay đổi:', data);
            
            if (user.ID_NV) {
                orderService.getOrdersByStaff(user.ID_NV)
                    .then(updatedOrders => {
                        setOrders(updatedOrders || []);
                    })
                    .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng:', error));
            }
        });

        // Lắng nghe socket cho thông báo mới (nếu có event riêng)
        if (socketService.socket) {
            socketService.socket.on('notification:new', (data) => {
                console.log('Nhận được sự kiện notification:new:', data);
                fetchNotifications(user.ID_NV);
                // Hiển thị toast khi có thông báo mới
                toast.info(`🔔 Thông báo mới: ${data.message || 'Bạn có thông báo mới!'}`);
            });
        }
        
        // Hủy đăng ký các lắng nghe khi component unmount
        return () => {
            unsubNewOrder();
            unsubOrderAccepted();
            unsubOrderStatusChanged();
            if (socketService.socket) {
                socketService.socket.off('notification:new');
            }
        };
    }, [auth.isAuthenticated, user, fetchNotifications]);

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    const handleAcceptOrder = async (idDH) => {
        if (!user || !user.ID_NV) {
            setError('Bạn cần đăng nhập với vai trò nhân viên để có thể nhận đơn hàng.');
            return;
        }
        
        if (!window.confirm('Bạn có muốn nhận đơn hàng này không?')) {
            return;
        }
        
        try {
            setLoading(true);
            try {
                // Cập nhật đơn hàng với ID của nhân viên hiện tại và trạng thái "Đã tiếp nhận"
                await orderService.acceptOrder(idDH, user.ID_NV);
            } catch (error) {
                // Nếu API acceptOrder không hoạt động, thử cập nhật trạng thái thay thế
                console.log('Thử phương pháp thay thế...', error);
                await orderService.updateOrderStatus(idDH, 'Đã tiếp nhận');
            }
            
            // Emit sự kiện socket khi nhân viên nhận đơn hàng
            if (socketService.socket) {
                socketService.socket.emit('order:accepted', {
                    idDH,
                    staffId: user.ID_NV,
                    staffName: user.HoTen || 'Nhân viên',
                    time: new Date()
                });
            }
            
            // Refresh danh sách đơn hàng sau khi cập nhật
            const updatedOrders = await orderService.getOrdersByStaff(user.ID_NV);
            setOrders(updatedOrders || []);
            
            // Sử dụng toast thay vì alert để thông báo
            toast.success('Đã nhận đơn hàng thành công!');
        } catch (err) {
            setError(err.message || 'Lỗi khi nhận đơn hàng');
            console.error('Error accepting order:', err);
            toast.error(`Lỗi: ${err.message || 'Không thể nhận đơn hàng'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (idDH, TrangThaiDonHang) => {
        // Validate valid status before sending to API
        const validStatuses = [
            'Đã tiếp nhận',
            'Đang lấy',
            'Đã lấy',
            'Lấy thất bại',
            'Đang vận chuyển',
            'Đang giao',
            'Đã giao',
            'Giao thất bại',
            'Quá hạn giao',
            'Huỷ giao',
            'Đã Hoàn'
        ];
        if (!validStatuses.includes(TrangThaiDonHang)) {
            setError(`Trạng thái "${TrangThaiDonHang}" không hợp lệ. Vui lòng chọn một trong các trạng thái hợp lệ.`);
            return;
        }
        try {
            setLoading(true);
            let orderToUpdate = orders.find(order => order.ID_DH === idDH);
            const orderCode = orderToUpdate?.MaVanDon || `ID-${idDH}`;
            const oldStatus = orderToUpdate?.TrangThaiDonHang || 'Không xác định';
            await orderService.updateOrderStatus(idDH, TrangThaiDonHang);
            // Cập nhật state tại chỗ, không cần reload toàn bộ danh sách
            const now = new Date();
            if (TrangThaiDonHang === 'Đã giao') {
                // Chuyển đơn sang deliveredOrders và cập nhật thời gian trạng thái
                const updatedOrder = { ...orderToUpdate, TrangThaiDonHang, ThoiGianCapNhat: now };
                setOrders(prev => prev.filter(order => order.ID_DH !== idDH));
                setDeliveredOrders(prev => [...prev, updatedOrder]);
            } else {
                // Cập nhật trạng thái đơn và thời gian trong orders
                setOrders(prev => prev.map(order =>
                    order.ID_DH === idDH ? { ...order, TrangThaiDonHang, ThoiGianCapNhat: now } : order
                ));
            }
            // Emit socket event
            const socketEventData = {
                orderId: idDH,
                orderCode: orderCode,
                staffId: user?.ID_NV || 'unknown',
                staffName: user?.HoTen || 'Nhân viên',
                oldStatus: oldStatus,
                newStatus: TrangThaiDonHang || 'Không xác định',
                timestamp: new Date().toISOString(),
                formattedTime: new Date().toLocaleString('vi-VN'),
                // message: `Đơn hàng ${orderCode} đã được ${user?.HoTen || 'Nhân viên'} thay đổi trạng thái từ "${oldStatus}" sang "${TrangThaiDonHang || 'Không xác định'}"`
            };
            if (socketService.socket) {
                socketService.socket.emit('order:status_changed', socketEventData);
            }
            toast.success(`Đơn hàng ${orderCode} đã được cập nhật trạng thái: ${TrangThaiDonHang}`);
        } catch (err) {
            setError(err.message || 'Lỗi khi cập nhật trạng thái');
            console.error('Error updating status:', err);
            toast.error(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái đơn hàng'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAcceptPendingOrder = async (idDHT) => {
        if (!user || !user.ID_NV) {
            setError('Bạn cần đăng nhập với vai trò nhân viên để có thể nhận đơn hàng.');
            return;
        }
        
        if (!window.confirm('Bạn có muốn nhận đơn hàng này không?')) {
            return;
        }
        
        try {
            setLoading(true);
            
            try {
                // Gọi API để nhận đơn hàng tạm
                await orderService.acceptPendingOrder(idDHT, user.ID_NV);
            } catch (error) {
                // Nếu API acceptPendingOrder không hoạt động, thử cập nhật trạng thái thay thế
                console.log('Thử phương pháp thay thế cho pending order...', error);
                await orderService.updateOrderStatus(idDHT, 'Đã tiếp nhận');
            }
            
            // Cập nhật lại danh sách đơn hàng tạm
            const updatedPendingOrders = await orderService.getPendingOrders();
            setPendingOrders(updatedPendingOrders || []);
            
            // Cập nhật lại danh sách đơn hàng đã nhận
            const updatedOrders = await orderService.getOrdersByStaff(user.ID_NV);
            setOrders(updatedOrders || []);
            
            // Emit sự kiện socket khi nhân viên nhận đơn hàng
            if (socketService.socket) {
                socketService.socket.emit('order:accepted', {
                    idDH: idDHT,
                    staffId: user.ID_NV,
                    staffName: user.HoTen || 'Nhân viên',
                    time: new Date()
                });
            }
            
            // Sử dụng toast thay vì alert để thông báo
            toast.success('Đã nhận đơn hàng thành công!');
        } catch (err) {
            setError(err.message || 'Lỗi khi nhận đơn hàng');
            console.error('Error accepting pending order:', err);
            toast.error(`Lỗi: ${err.message || 'Không thể nhận đơn hàng'}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = () => {
        logout();
    };
    
    // Loading and Error States
    if (loading) {
        return <div className="loading-container">Đang tải dữ liệu trang...</div>;
    }
    
    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    
    // Render based on fetched user data
    return (
        <div className="staff-page-container">
            {/* Sidebar */}
            <aside className="staff-sidebar">
                <nav className="staff-sidebar-nav">
                    <div
                        className={`staff-sidebar-item ${activeItem === 'main' ? 'active' : ''}`}
                        onClick={() => handleItemClick('main')}
                    >
                        <span className="staff-sidebar-icon">🏠</span>
                        Trang chính
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'pending' ? 'active' : ''}`}
                        onClick={() => handleItemClick('pending')}
                    >
                        <span className="staff-sidebar-icon">⏱️</span>
                        Đơn hàng chờ xử lý
                        {pendingOrders.length > 0 && <span className="pending-badge">{pendingOrders.length}</span>}
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'assigned' ? 'active' : ''}`}
                        onClick={() => handleItemClick('assigned')}
                    >
                        <span className="staff-sidebar-icon">📋</span>
                        Đơn hàng đã nhận
                        {orders.length > 0 && <span className="order-count">{orders.length}</span>}
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'delivered' ? 'active' : ''}`}
                        onClick={() => handleItemClick('delivered')}
                    >
                        <span className="staff-sidebar-icon">✅</span>
                        Đơn đã giao thành công
                        {deliveredOrders.length > 0 && <span className="order-count">{deliveredOrders.length}</span>}
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'profile' ? 'active' : ''}`}
                        onClick={() => handleItemClick('profile')}
                    >
                        <span className="staff-sidebar-icon">👤</span>
                        Hồ sơ
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'settings' ? 'active' : ''}`}
                        onClick={() => handleItemClick('settings')}
                    >
                        <span className="staff-sidebar-icon">⚙️</span>
                        Cài đặt
                    </div>
                    <div
                        className={`staff-sidebar-item ${activeItem === 'logout' ? 'active' : ''}`}
                        onClick={handleLogout}
                    >
                        <span className="staff-sidebar-icon">🚪</span>
                        Đăng xuất
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col" style={{ alignItems: 'flex-end' }}>
                <header className="staff-header">
                    <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
                        <h1 className="staff-title" style={{ marginLeft: 'auto', textAlign: 'right', width: '100%' }}>
                            Trang Nhân Viên
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-end', width: '100%' }}>
                            {/* Chuông thông báo */}
                            <button
                                className="notification-bell"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    marginLeft: 'auto',
                                    padding: 0
                                }}
                                onClick={async () => {
                                    setIsNotificationOpen((prev) => !prev);
                                    // Nếu mở popup, gọi API đánh dấu đã đọc
                                    if (!isNotificationOpen && user && user.ID_NV && unreadCount > 0) {
                                        try {
                                            await notificationService.markAllAsRead(user.ID_NV);
                                            fetchNotifications(user.ID_NV);
                                        } catch (err) {
                                            console.error('Lỗi khi đánh dấu đã đọc:', err);
                                        }
                                    }
                                }}
                                aria-label="Xem thông báo"
                            >
                                {/* Sử dụng icon SVG cho chuông */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                    style={{ display: 'block' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        background: '#ef4444',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        fontSize: 12,
                                        minWidth: 18,
                                        height: 18,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 5px'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {user && (
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-700">
                                        Xin chào, {user.HoTen || 'Nhân viên'}
                                    </p>
                                    <p className="text-sm text-gray-500">{user.DiaChi || 'Không có địa chỉ'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="staff-content">
                    {error && <div className="message error-message mb-4">{error}</div>}
                    {/* Render content based on activeItem */}
                    {activeItem === 'main' && user && (
                        <div className="order-form-container">
                            <StaffView 
                                pendingOrders={pendingOrders}
                                orders={orders}
                                employees={employees}
                                loading={loading}
                                handleAcceptPendingOrder={handleAcceptPendingOrder}
                                handleAcceptOrder={handleAcceptOrder}
                                handleStatusChange={handleStatusChange}
                            />
                        </div>
                    )}

                    {/* Pending Orders View */}
                    {activeItem === 'pending' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Đơn hàng chờ xử lý</h2>
                            {pendingOrders.length === 0 ? (
                                <p className="no-orders-message">Không có đơn hàng nào đang chờ xử lý</p>
                            ) : (
                                <div className="pending-orders-list">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Mã vận đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Người nhận</th>
                                                <th>Hàng hoá</th>
                                                <th>Ngày tạo</th>
                                                <th>Tiền thu hộ</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingOrders.map((order) => (
                                                <tr key={order.ID_DH} className="order-row">
                                                    <td className="order-code">{order.MaVanDon}</td>
                                                    <td>{order.TenKhachHang || 'N/A'}</td>
                                                    <td>{order.TenNguoiNhan || 'N/A'}</td>
                                                    <td>{order.TenHH || 'N/A'}</td>
                                                    <td>
                                                        {order.NgayTaoDon ? 
                                                            new Date(order.NgayTaoDon).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </td>
                                                    <td>
                                                        {order.TienThuHo ? 
                                                            new Intl.NumberFormat('vi-VN', { 
                                                                style: 'currency', 
                                                                currency: 'VND' 
                                                            }).format(order.TienThuHo) : '0 đ'}
                                                    </td>
                                                    <td className="order-actions">
                                                        <button 
                                                            className="accept-button"
                                                            onClick={() => handleAcceptPendingOrder(order.ID_DHT || order.ID_DH)}
                                                            disabled={loading}
                                                        >
                                                            {loading ? 'Đang xử lý...' : 'Nhận đơn'}
                                                        </button>
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
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assigned Orders View */}
                    {activeItem === 'assigned' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Đơn hàng đã nhận</h2>
                            {orders.length === 0 ? (
                                <p className="no-orders-message">Bạn chưa nhận đơn hàng nào</p>
                            ) : (
                                <div className="staff-orders-list">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Mã vận đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Người nhận</th>
                                                <th>Hàng hoá</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày tạo</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.ID_DH} className="order-row">
                                                    <td className="order-code">{order.MaVanDon}</td>
                                                    <td>{order.TenKhachHang || 'N/A'}</td>
                                                    <td>{order.TenNguoiNhan || 'N/A'}</td>
                                                    <td>{order.TenHH || 'N/A'}</td>
                                                    <td>
                                                        <span className={`status-badge status-${order.TrangThaiDonHang?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                                                            {order.TrangThaiDonHang || 'Chưa xác định'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {order.NgayTaoDon ? 
                                                            new Date(order.NgayTaoDon).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </td>
                                                    <td className="order-actions">
                                                        <select 
                                                            className="status-select"
                                                            value={order.TrangThaiDonHang || ''}
                                                            onChange={(e) => handleStatusChange(order.ID_DH, e.target.value)}
                                                        >
                                                            <option value="" disabled>Chọn trạng thái</option>
                                                            <option value="Đã tiếp nhận">Đã tiếp nhận</option>
                                                            <option value="Đang lấy">Đang lấy</option>
                                                            <option value="Đã lấy">Đã lấy</option>
                                                            <option value="Lấy thất bại">Lấy thất bại</option>
                                                            <option value="Đang vận chuyển">Đang vận chuyển</option>
                                                            <option value="Đang giao">Đang giao</option>
                                                            <option value="Đã giao">Đã giao</option>
                                                            <option value="Giao thất bại">Giao thất bại</option>
                                                            <option value="Quá hạn giao">Quá hạn giao</option>
                                                            <option value="Huỷ giao">Huỷ giao</option>
                                                            <option value="Đã Hoàn">Đã Hoàn</option>
                                                        </select>
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
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivered Orders View */}
                    {activeItem === 'delivered' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Đơn đã giao thành công</h2>
                            {deliveredOrders.length === 0 ? (
                                <p className="no-orders-message">Chưa có đơn hàng nào giao thành công</p>
                            ) : (
                                <div className="delivered-orders-list">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Mã vận đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Người nhận</th>
                                                <th>Hàng hoá</th>
                                                <th>Ngày giao</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deliveredOrders.map((order) => (
                                                <tr key={order.ID_DH} className="order-row">
                                                    <td className="order-code">{order.MaVanDon}</td>
                                                    <td>{order.TenKhachHang || 'N/A'}</td>
                                                    <td>{order.TenNguoiNhan || 'N/A'}</td>
                                                    <td>{order.TenHH || 'N/A'}</td>
                                                    <td>{order.NgayTaoDon ? new Date(order.NgayTaoDon).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Section */}
                    {activeItem === 'profile' && user && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Thông tin cá nhân</h2>
                            <div className="profile-section">
                                <div className="profile-details">
                                    <p><strong>Họ tên:</strong> {user.HoTen}</p>
                                    <p><strong>Email:</strong> {user.Email}</p>
                                    <p><strong>Điện thoại:</strong> {user.SDT}</p>
                                    <p><strong>Địa chỉ:</strong> {user.DiaChi}</p>
                                    <p><strong>Vai trò:</strong> Nhân viên</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Section */}
                    {activeItem === 'settings' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Cài đặt</h2>
                            <p>Tính năng cài đặt đang được phát triển...</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Order Details Modal */}
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
                            <div className={`timeline-step ${['Đang chờ xử lý', 'Đã tiếp nhận', 'Đang lấy', 'Đã lấy', 'Đang vận chuyển', 'Đang giao', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div className="timeline-label">Đang chờ xử lý</div>
                            </div>
                            <div className={`timeline-step ${['Đã tiếp nhận', 'Đang lấy', 'Đã lấy', 'Đang vận chuyển', 'Đang giao', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
                                <div className="timeline-icon">
                                    <i className="fas fa-clipboard-check"></i>
                                </div>
                                <div className="timeline-label">Đã tiếp nhận</div>
                            </div>
                            <div className={`timeline-step ${['Đang vận chuyển', 'Đang giao', 'Đã giao'].includes(selectedOrder.TrangThaiDonHang) ? 'active' : ''}`}>
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
                                        <span className="detail-label">Ngày giao dự kiến:</span>
                                        <span className="detail-value">
                                            <i className="fas fa-calendar-check detail-icon"></i>
                                            {selectedOrder.NgayGiaoDuKien ? new Date(selectedOrder.NgayGiaoDuKien).toLocaleDateString('vi-VN') : 'N/A'}
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
                                        <span className="detail-label">Thu hộ (COD):</span>
                                        <span className="detail-value cod-amount">
                                            <i className="fas fa-hand-holding-usd detail-icon"></i> 
                                            {formatCurrency(selectedOrder.TienThuHo || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-detail-section">
                                <h4><i className="fas fa-user"></i> Thông tin khách hàng</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Tên khách hàng:</span>
                                        <span className="detail-value">{selectedOrder.TenKhachHang || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Số điện thoại:</span>
                                        <span className="detail-value phone-value">
                                            <i className="fas fa-phone-alt detail-icon"></i>
                                            {selectedOrder.SdtKhachHang || selectedOrder.SdtKH || selectedOrder.SDT_KH || selectedOrder.SDT || 'N/A'}
                                            {(selectedOrder.SdtKhachHang || selectedOrder.SdtKH || selectedOrder.SDT_KH || selectedOrder.SDT) && (
                                                <a 
                                                    href={`tel:${selectedOrder.SdtKhachHang || selectedOrder.SdtKH || selectedOrder.SDT_KH || selectedOrder.SDT}`} 
                                                    className="phone-link"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Gọi số này"
                                                >
                                                    <i className="fas fa-phone"></i>
                                                </a>
                                            )}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Địa chỉ:</span>
                                        <span className="detail-value address-value">
                                            <i className="fas fa-map-marker-alt detail-icon"></i>
                                            {selectedOrder.DiaChiKH || selectedOrder.DiaChi || 'N/A'}
                                        </span>
                                    </div>
                                
                                </div>
                            </div>
                            <div className="order-detail-section">
                                <h4><i className="fas fa-user-friends"></i> Thông tin người nhận</h4>
                                <div className="order-detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Tên người nhận:</span>
                                        <span className="detail-value">{selectedOrder.TenNguoiNhan || selectedOrder.Ten_NN || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Số điện thoại:</span>
                                        <span className="detail-value phone-value">
                                            <i className="fas fa-phone-alt detail-icon"></i>
                                            {selectedOrder.SdtNguoiNhan || selectedOrder.Sdt_NN || 'N/A'}
                                            {(selectedOrder.SdtNguoiNhan || selectedOrder.Sdt_NN) && (
                                                <a 
                                                    href={`tel:${selectedOrder.SdtNguoiNhan || selectedOrder.Sdt_NN}`} 
                                                    className="phone-link"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Gọi số này"
                                                >
                                                    <i className="fas fa-phone"></i>
                                                </a>
                                            )}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Địa chỉ:</span>
                                        <span className="detail-value address-value">
                                            <i className="fas fa-map-marker-alt detail-icon"></i>
                                            {selectedOrder.DiaChiNN || selectedOrder.DiaChi_NN || 'N/A'}
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
                                </div>
                            </div>
                        </div>

                        <div className="order-modal-footer">
                            <button className="modal-close-button" onClick={handleCloseModal}>
                                <i className="fas fa-times"></i> Đóng
                            </button>
                            {activeItem === 'pending' && (
                                <button 
                                    className="modal-accept-button"
                                    onClick={() => {
                                        handleAcceptPendingOrder(selectedOrder.ID_DHT || selectedOrder.ID_DH);
                                        handleCloseModal();
                                    }}
                                    disabled={loading}
                                >
                                    <i className="fas fa-check"></i> Nhận đơn hàng
                                </button>
                            )}
                            {activeItem === 'pending' && (
                                <div className="modal-status-container">
                                    <label htmlFor="modal-status-select">Cập nhật trạng thái:</label>
                                    <select 
                                        id="modal-status-select"
                                        className="modal-status-select"
                                        value={selectedOrder.TrangThaiDonHang || ''}
                                        onChange={(e) => {
                                            handleStatusChange(selectedOrder.ID_DH, e.target.value);
                                            setTimeout(handleCloseModal, 500);
                                        }}
                                    >
                                        <option value="Đã tiếp nhận">Đã tiếp nhận</option>
                                        <option value="Đang lấy">Đang lấy</option>
                                        <option value="Đã lấy">Đã lấy</option>
                                        <option value="Lấy thất bại">Lấy thất bại</option>
                                        <option value="Đang vận chuyển">Đang vận chuyển</option>
                                        <option value="Đang giao">Đang giao</option>
                                        <option value="Đã giao">Đã giao</option>
                                        <option value="Giao thất bại">Giao thất bại</option>
                                        <option value="Quá hạn giao">Quá hạn giao</option>
                                        <option value="Huỷ giao">Huỷ giao</option>
                                        <option value="Đã Hoàn">Đã Hoàn</option>
                                    </select>
                                </div>
                            )}
                            <button className="modal-print-button" onClick={() => window.print()}>
                                <i className="fas fa-print"></i> In đơn hàng
                            </button>
                            <button className="modal-map-button" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedOrder.DiaChiNN || '')}`, '_blank')}>
                                <i className="fas fa-map-marked-alt"></i> Xem bản đồ
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Popup danh sách thông báo */}
            {isNotificationOpen && (
                <StaffNotification
                    notifications={notifications}
                    onClose={() => setIsNotificationOpen(false)}
                />
            )}
        </div>
    );
};

export default StaffPage;
