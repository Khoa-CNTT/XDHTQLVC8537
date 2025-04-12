import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { orderService } from '../../services/orderSevice.js';
import { productService } from '../../services/productService.js';
import { authService } from '../../services/authService.js'; // Ensure this import exists
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import './UserPage.css';
// Import ProfileSection if you intend to use it for the profile tab
// import ProfileSection from '../../components/ProfileSection';

const UserPage = () => {
    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const [activeItem, setActiveItem] = useState('main');
    const [user, setUser] = useState(null); // Holds detailed user info (KH or NV) + base info
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]); // Staff orders
    const [userOrders, setUserOrders] = useState([]); // Customer orders
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Start loading true
    const [order, setOrder] = useState({
        ID_NV: '',
        receiverName: '',
        receiverAddress: '',
        receiverPhone: '',
        ID_HH: '',
        notes: ''
    });

    // Memoize fetchUserData to prevent recreation on every render
    const fetchUserData = useCallback(async (userId, userRole) => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            // Fetch role-specific details (includes Email, SDT from backend now)
            let specificUserData = null;
            if (userRole === 'staff') {
                specificUserData = await authService.getNhanVienByTK(userId);
            } else if (userRole === 'user') {
                specificUserData = await authService.getKhachHangByTK(userId);
            }

            if (!specificUserData) {
                throw new Error('Không thể tải thông tin chi tiết người dùng.');
            }

            // Combine base auth info with specific details
            const combinedUserData = {
                ID_TK: userId,
                Role: userRole,
                ...specificUserData, // Spread fetched details (ID_KH/ID_NV, Ten_KH/Ten_NV, DiaChi, Email, SDT)
                // Ensure HoTen is set correctly
                HoTen: userRole === 'staff' ? specificUserData.Ten_NV : specificUserData.Ten_KH,
            };
            setUser(combinedUserData); // Set the detailed user state

            // Fetch additional data only after user data is confirmed
            const empPromise = authService.getNhanVien();
            const prodPromise = productService.getProducts();
            let ordersPromise;

            if (userRole === 'staff' && combinedUserData.ID_NV) {
                ordersPromise = orderService.getOrdersByStaff(combinedUserData.ID_NV);
            } else if (userRole === 'user' && combinedUserData.ID_KH) {
                ordersPromise = orderService.getOrdersByCustomer(combinedUserData.ID_KH);
            } else {
                ordersPromise = Promise.resolve([]); // No orders to fetch or ID missing
            }

            // Wait for all promises
            const [empData, prodData, ordersData] = await Promise.all([
                empPromise,
                prodPromise,
                ordersPromise
            ]);

            setEmployees(empData || []);
            setProducts(prodData || []);

            if (userRole === 'staff') {
                setOrders(ordersData || []);
            } else if (userRole === 'user') {
                setUserOrders(ordersData || []);
            }

        } catch (err) {
            console.error('Error fetching user page data:', err);
            setError(`Lỗi khi tải dữ liệu: ${err.message}`);
            // Consider logging out if essential data fails
            // logout();
            // navigate('/login', { replace: true });
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array for useCallback

    useEffect(() => {
        // Check auth state from context
        if (!auth.isLoading) { // Only run after auth state is determined
            if (!auth.isAuthenticated || !auth.userId) {
                navigate('/login', { replace: true });
            } else {
                // Fetch data if authenticated
                fetchUserData(auth.userId, auth.userRole);
            }
        }
        // Depend on auth state changes
    }, [auth.isLoading, auth.isAuthenticated, auth.userId, auth.userRole, navigate, fetchUserData]);

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        // Ensure user and user.ID_KH exist before proceeding
        if (!user || !user.ID_KH) {
            setError('Không thể tạo đơn hàng: thiếu thông tin khách hàng.');
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const orderData = {
                ID_NV: parseInt(order.ID_NV),
                ID_KH: user.ID_KH,
                ID_HH: parseInt(order.ID_HH),
                receiverName: order.receiverName,
                receiverAddress: order.receiverAddress,
                receiverPhone: order.receiverPhone,
                MaVanDon: `VD${Date.now()}`,
                NgayTaoDon: new Date().toISOString().slice(0, 19).replace('T', ' '),
                NgayGiaoDuKien: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 19)
                    .replace('T', ' '),
                TrangThaiDonHang: 'Pending',
                PhiGiaoHang: 50.0,
                GhiChu: order.notes,
            };

            await orderService.createOrder(orderData);

            // Refresh user orders
            const updatedOrders = await orderService.getOrdersByCustomer(user.ID_KH);
            setUserOrders(updatedOrders);

            alert('Đơn hàng đã được tạo thành công!');
            setOrder({
                ID_NV: '',
                receiverName: '',
                receiverAddress: '',
                receiverPhone: '',
                ID_HH: '',
                notes: '',
            });
        } catch (err) {
            setError(err || 'Lỗi khi tạo đơn hàng');
            console.error('Error creating order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (idDH, TrangThaiDonHang) => {
        try {
            setLoading(true);
            await orderService.updateOrderStatus(idDH, TrangThaiDonHang);
            setOrders((prev) =>
                prev.map((order) =>
                    order.ID_DH === idDH ? { ...order, TrangThaiDonHang } : order
                )
            );
            alert('Cập nhật trạng thái thành công!');
        } catch (err) {
            setError(err || 'Lỗi khi cập nhật trạng thái');
            console.error('Error updating status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        // Navigation is handled by App.jsx based on auth state
    };

    // Loading and Error States
    if (loading) {
        return <div className="loading-container">Đang tải dữ liệu trang...</div>;
    }

    // Render based on fetched user data
    return (
        <div className="user-page-container">
            {/* Sidebar */}
            <aside className="user-sidebar">
                <nav className="user-sidebar-nav">
                    <div
                        className={`user-sidebar-item ${activeItem === 'main' ? 'active' : ''}`}
                        onClick={() => handleItemClick('main')}
                    >
                        <span className="user-sidebar-icon">🏠</span>
                        Trang chính
                    </div>
                    <div
                        className={`user-sidebar-item ${activeItem === 'profile' ? 'active' : ''}`}
                        onClick={() => handleItemClick('profile')}
                    >
                        <span className="user-sidebar-icon">👤</span>
                        Hồ sơ
                    </div>
                    <div
                        className={`user-sidebar-item ${activeItem === 'settings' ? 'active' : ''}`}
                        onClick={() => handleItemClick('settings')}
                    >
                        <span className="user-sidebar-icon">⚙️</span>
                        Cài đặt
                    </div>
                    <div
                        className={`user-sidebar-item ${activeItem === 'logout' ? 'active' : ''}`}
                        onClick={handleLogout} // Use the updated handleLogout
                    >
                        <span className="user-sidebar-icon">🚪</span>
                        Đăng xuất
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                <header className="user-header">
                    <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
                        <h1 className="user-title">
                            {/* Use user.Role if user is loaded, otherwise fallback or show loading */}
                            {user ? (user.Role === 'staff' ? 'Trang Nhân Viên' : 'Trang Người Dùng') : 'Trang Người Dùng'}
                        </h1>
                        {/* Display user info only if user state is populated */}
                        {user && (
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">
                                    Xin chào, {user.HoTen || 'Người dùng'}
                                </p>
                                <p className="text-sm text-gray-500">{user.DiaChi || 'Không có địa chỉ'}</p>
                            </div>
                        )}
                    </div>
                </header>
                <main className="user-content">
                    {/* Display error message if any */}
                    {error && <div className="message error-message mb-4">{error}</div>}

                    {/* Render content based on activeItem and ensure user exists */}
                    {activeItem === 'main' && user && (
                        <div className="order-form-container">
                            {/* Staff View */}
                            {user.Role === 'staff' && (
                                <>
                                    <h2 className="order-form-title">Danh sách đơn hàng</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Khách Hàng</th>
                                                <th>Hàng Hóa</th>
                                                <th>Người Nhận</th>
                                                <th>Trạng Thái</th>
                                                <th>Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.ID_DH}>
                                                    <td>{order.MaVanDon}</td>
                                                    <td>{order.Ten_KH}</td>
                                                    <td>{order.TenHH}</td>
                                                    <td>{order.Ten_NN}</td>
                                                    <td>{order.TrangThaiDonHang}</td>
                                                    <td>
                                                        <select
                                                            value={order.TrangThaiDonHang}
                                                            onChange={(e) => handleStatusChange(order.ID_DH, e.target.value)}
                                                            disabled={loading}
                                                        >
                                                            <option value="Pending">Đang Chờ</option>
                                                            <option value="Delivered">Đã Giao</option>
                                                            <option value="Cancelled">Đã Hủy</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Hiển thị danh sách nhân viên */}
                                    <h2 className="order-form-title">Danh sách nhân viên</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>ID Nhân Viên</th>
                                                <th>Tên Nhân Viên</th>
                                                <th>Email</th>
                                                <th>Số Điện Thoại</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees && employees.length > 0 ? (
                                                employees.map((emp) => (
                                                    <tr key={emp.ID_NV}>
                                                        <td>{emp.ID_NV}</td>
                                                        <td>{emp.Ten_NV}</td>
                                                        <td>{emp.Email || 'N/A'}</td>
                                                        <td>{emp.SoDienThoai || 'N/A'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">Không có dữ liệu nhân viên</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                            {/* User View */}
                            {user.Role === 'user' && (
                                <>
                                    <h2 className="order-form-title">Tạo đơn hàng vận chuyển</h2>
                                    {/* Pass user.ID_KH safely */}
                                    <form onSubmit={handleOrderSubmit} className="order-form">
                                        <div className="form-group">
                                            <label>Nhân viên phụ trách</label>
                                            <select
                                                name="ID_NV"
                                                value={order.ID_NV}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Chọn nhân viên</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.ID_NV} value={emp.ID_NV}>
                                                        {emp.Ten_NV}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Tên người nhận</label>
                                            <input
                                                type="text"
                                                name="receiverName"
                                                value={order.receiverName}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Nhập tên người nhận"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Địa chỉ người nhận</label>
                                            <input
                                                type="text"
                                                name="receiverAddress"
                                                value={order.receiverAddress}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Nhập địa chỉ người nhận"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Số điện thoại người nhận</label>
                                            <input
                                                type="tel"
                                                name="receiverPhone"
                                                value={order.receiverPhone}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Nhập số điện thoại"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Hàng hóa</label>
                                            <select
                                                name="ID_HH"
                                                value={order.ID_HH}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Chọn hàng hóa</option>
                                                {products.map((prod) => (
                                                    <option key={prod.ID_HH} value={prod.ID_HH}>
                                                        {prod.TenHH} (Trọng lượng: {prod.TrongLuong}kg)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Ghi chú (tùy chọn)</label>
                                            <textarea
                                                name="notes"
                                                value={order.notes}
                                                onChange={handleInputChange}
                                                className="form-textarea"
                                                placeholder="Nhập ghi chú nếu có"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button type="submit" className="submit-button" disabled={loading}>
                                                {loading ? 'Đang tạo...' : 'Tạo đơn hàng'}
                                            </button>
                                        </div>
                                    </form>
                                    <h2 className="order-form-title">Lịch sử đơn hàng</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Hàng Hóa</th>
                                                <th>Người Nhận</th>
                                                <th>Địa Chỉ Nhận</th>
                                                <th>Trạng Thái</th>
                                                <th>Ngày Tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userOrders.map((order) => (
                                                <tr key={order.ID_DH}>
                                                    <td>{order.MaVanDon}</td>
                                                    <td>{order.TenHH}</td>
                                                    <td>{order.Ten_NN}</td>
                                                    <td>{order.DiaChiNguoiNhan}</td>
                                                    <td>{order.TrangThaiDonHang}</td>
                                                    <td>{new Date(order.NgayTaoDon).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}
                    {/* Placeholder for Profile Section */}
                    {activeItem === 'profile' && user && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Thông tin cá nhân</h2>
                            {/* You can reuse ProfileSection here if needed */}
                            {/* <ProfileSection user={user} /> */}
                            <div className="profile-section"> {/* Basic display */}
                                <p><strong>Họ tên:</strong> {user.HoTen}</p>
                                <p><strong>Email:</strong> {user.Email}</p>
                                <p><strong>Điện thoại:</strong> {user.SDT}</p>
                                <p><strong>Địa chỉ:</strong> {user.DiaChi}</p>
                                <p><strong>Vai trò:</strong> {user.Role === 'staff' ? 'Nhân viên' : 'Khách hàng'}</p>
                            </div>
                        </div>
                    )}
                    {/* Placeholder for Settings Section */}
                    {activeItem === 'settings' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Cài đặt</h2>
                            <p>Tính năng cài đặt đang được phát triển...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserPage;
