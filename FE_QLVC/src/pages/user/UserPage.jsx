import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { orderService } from '../../services/orderService.js'; 
import { authService } from '../../services/authService.js'; // Ensure this import exists
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import './UserPage.css';
// Import ProfileSection if you intend to use it for the profile tab
// import ProfileSection from '../../components/ProfileSection';

const UserPage = () => {    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const [activeItem, setActiveItem] = useState('main');    const [user, setUser] = useState(null); // Holds detailed user info (KH or NV) + base info
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]); // Staff orders
    const [pendingOrders, setPendingOrders] = useState([]); // For pending orders
    const [userOrders, setUserOrders] = useState([]); // Customer orders
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Start loading true
    const [showPaymentForm, setShowPaymentForm] = useState(false);    const [createdOrder, setCreatedOrder] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState(null);    const [order, setOrder] = useState({
        ID_NV: '',
        receiverName: '',
        receiverAddress: '',
        receiverPhone: '',
        productName: '',
        weight: '',
        productType: '',
        productCharacteristics: [],
        codAmount: 0,
        notes: '',
        productImage: null,
        quantity: 1 // Thêm trường số lượng với giá trị mặc định là 1
    });
    const [productImagePreview, setProductImagePreview] = useState(null);

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
            setUser(combinedUserData); // Set the detailed user state            // Fetch additional data only after user data is confirmed
            const empPromise = authService.getNhanVien();
            let ordersPromise;
            let pendingOrdersPromise = Promise.resolve([]);

            if (userRole === 'staff' && combinedUserData.ID_NV) {
                ordersPromise = orderService.getOrdersByStaff(combinedUserData.ID_NV);
                // Fetch pending orders only for staff
                pendingOrdersPromise = orderService.getPendingOrders();
            } else if (userRole === 'user' && combinedUserData.ID_KH) {
                ordersPromise = orderService.getOrdersByCustomer(combinedUserData.ID_KH);
            } else {
                ordersPromise = Promise.resolve([]); // No orders to fetch or ID missing
            }            // Wait for all promises
            const [empData, ordersData, pendingOrdersData] = await Promise.all([
                empPromise,
                ordersPromise,
                pendingOrdersPromise
            ]);            setEmployees(empData || []);

            if (userRole === 'staff') {
                setOrders(ordersData || []);
                setPendingOrders(pendingOrdersData || []);
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
    };    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));
    };
      // Hàm xử lý cho các checkbox tính chất hàng hóa
    const handleCharacteristicsChange = (e) => {
        const { value, checked } = e.target;
        setOrder(prev => {
            if (checked) {
                // Thêm vào mảng nếu được chọn
                return {
                    ...prev,
                    productCharacteristics: [...prev.productCharacteristics, value]
                };
            } else {
                // Loại bỏ khỏi mảng nếu bỏ chọn
                return {
                    ...prev,
                    productCharacteristics: prev.productCharacteristics.filter(item => item !== value)
                };
            }
        });
    };
    
    // Hàm xử lý tải lên ảnh sản phẩm
    const handleProductImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước ảnh không được vượt quá 5MB');
            return;
        }
        
        // Kiểm tra định dạng file
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Chỉ chấp nhận định dạng JPG, JPEG hoặc PNG');
            return;
        }
        
        // Cập nhật state với file ảnh
        setOrder(prev => ({
            ...prev,
            productImage: file
        }));
        
        // Tạo URL xem trước ảnh
        const previewURL = URL.createObjectURL(file);
        setProductImagePreview(previewURL);
        
        // Xóa lỗi nếu có
        if (error && error.includes('ảnh')) {
            setError(null);
        }
    };// Hàm tính phí vận chuyển dựa trên trọng lượng
    const calculateShippingFee = () => {
        const weight = parseFloat(order.weight) || 0;
        // Tính phí giao hàng: 30.000đ cơ bản + 5.000đ cho mỗi kg
        const baseFee = 30000;
        const additionalFee = Math.ceil(weight) * 5000;
        return baseFee + additionalFee;
    };

    // Hàm định dạng tiền tệ VND
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Xử lý đóng form thanh toán
    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
        setCreatedOrder(null);
    };

    // Xử lý thanh toán
    const handlePayment = async (paymentMethod) => {
        if (!createdOrder) return;
        
        try {
            setLoading(true);
            // Đây là nơi bạn sẽ gọi API thanh toán thực tế
            // Ví dụ: await paymentService.processPayment(createdOrder.id, paymentMethod);
            
            alert(`Thanh toán thành công bằng ${paymentMethod}!`);
            setShowPaymentForm(false);
            setCreatedOrder(null);
            
            // Làm mới danh sách đơn hàng
            if (user && user.ID_KH) {
                const updatedOrders = await orderService.getOrdersByCustomer(user.ID_KH);
                setUserOrders(updatedOrders || []);
            }
        } catch (err) {
            setError(`Lỗi thanh toán: ${err.message || 'Không xác định'}`);
        } finally {
            setLoading(false);
        }
    };    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        // Ensure user and user.ID_KH exist before proceeding
        if (!user || !user.ID_KH) {
            setError('Không thể tạo đơn hàng: thiếu thông tin khách hàng.');
            return;
        }
        setError(null);
        setLoading(true);
        
        try {
            // Xác định ID tính chất hàng hóa dựa trên tính chất được chọn
            // Bây giờ chúng ta đã lưu trữ ID trực tiếp trong checkbox
            let ID_TCHH = 0; // Mặc định không có tính chất

            if (order.productCharacteristics && order.productCharacteristics.length > 0) {
                // Chọn ID cao nhất (ưu tiên) từ các tính chất đã chọn
                ID_TCHH = Math.max(...order.productCharacteristics.map(id => parseInt(id)));
            }
            
            // Nếu không có tính chất nào được chọn, gán giá trị mặc định là 1
            if (ID_TCHH === 0) ID_TCHH = 1;

            // Tạo đối tượng hàng hóa trước với đầy đủ trường bắt buộc
            const productData = {
                tenHH: order.productName,
                trongLuong: parseFloat(order.weight) || 0.1, // Đảm bảo giá trị hợp lệ
                ID_LHH: parseInt(order.productType) || 1,    // ID Loại hàng hóa - khóa ngoại
                ID_TCHH: ID_TCHH,                           // ID Tính chất hàng hóa - khóa ngoại
                donGia: 0, // Sẽ được tính ở backend hoặc người dùng có thể nhập
                soLuong: parseInt(order.quantity) || 1,     // Sử dụng số lượng từ form
                image: 'default.jpg' // Giá trị mặc định cho trường bắt buộc
            };

            // Chuẩn hóa dữ liệu cho phù hợp với API createOrder
            const orderData = {
                khachHangId: user.ID_KH,
                hangHoa: productData, // Gửi dữ liệu hàng hóa trực tiếp
                nguoiNhan: {
                    ten: order.receiverName,
                    diaChi: order.receiverAddress,
                    sdt: order.receiverPhone
                },                  phiGiaoHang: calculateShippingFee(),
                tienShip: calculateShippingFee(), // Thay thế tienHang bằng tienShip
                tienThuHo: parseInt(order.codAmount) || 0, 
                ghiChu: order.notes || '',
                trangThaiDonHang: 'Đang chờ xử lý' // Trạng thái ban đầu khi tạo đơn
            };

            // Thêm thông tin mô tả tính chất hàng hóa vào ghi chú để dễ đọc
            if (order.productCharacteristics && order.productCharacteristics.length > 0) {
                const tinhChatNames = {
                    '1': 'Giá trị cao',
                    '2': 'Dễ vỡ',
                    '3': 'Nguyên khối',
                    '4': 'Quá khổ',
                    '5': 'Chất lỏng',
                    '6': 'Từ tính, Pin'
                };
                
                const tinhChatDescriptions = order.productCharacteristics
                    .map(id => tinhChatNames[id] || `Tính chất ${id}`)
                    .join(', ');
                    
                orderData.ghiChu += ' | Tính chất: ' + tinhChatDescriptions;
            }

            const response = await orderService.createOrder(orderData);
            
            // Lưu thông tin đơn hàng vừa tạo
            setCreatedOrder(response.data);
            
            // Hiển thị form thanh toán
            setShowPaymentForm(true);

            // Refresh user orders
            const updatedOrders = await orderService.getOrdersByCustomer(user.ID_KH);
            setUserOrders(updatedOrders || []);

            // Reset form
            setOrder({
                ID_NV: '',
                receiverName: '',
                receiverAddress: '',
                receiverPhone: '',
                productName: '',
                weight: '',
                productType: '',
                productCharacteristics: [],
                codAmount: 0,
                notes: '',
                productImage: null,
                quantity: 1 // Reset số lượng về 1
            });
        } catch (err) {
            setError(err.message || 'Lỗi khi tạo đơn hàng');
            console.error('Error creating order:', err);
        } finally {
            setLoading(false);
        }
    };    const handleAcceptOrder = async (idDH) => {
        if (!user || !user.ID_NV) {
            setError('Bạn cần đăng nhập với vai trò nhân viên để có thể nhận đơn hàng.');
            return;
        }
        
        if (!window.confirm('Bạn có muốn nhận đơn hàng này không?')) {
            return;
        }
        
        try {
            setLoading(true);
            
            // Cập nhật đơn hàng với ID của nhân viên hiện tại và trạng thái "Đã nhận hàng"
            await orderService.acceptOrder(idDH, user.ID_NV);
            
            // Refresh danh sách đơn hàng sau khi cập nhật
            const updatedOrders = await orderService.getOrdersByStaff(user.ID_NV);
            setOrders(updatedOrders || []);
            
            alert('Đã nhận đơn hàng thành công!');
        } catch (err) {
            setError(err.message || 'Lỗi khi nhận đơn hàng');
            console.error('Error accepting order:', err);
        } finally {
            setLoading(false);
        }
    };
      const handleStatusChange = async (idDH, TrangThaiDonHang) => {
        try {
            setLoading(true);
            await orderService.updateOrderStatus(idDH, TrangThaiDonHang);
            
            // Refresh danh sách đơn hàng sau khi cập nhật
            if (user && user.ID_NV) {
                const updatedOrders = await orderService.getOrdersByStaff(user.ID_NV);
                setOrders(updatedOrders || []);
            }
            
            alert('Cập nhật trạng thái thành công!');
        } catch (err) {
            setError(err.message || 'Lỗi khi cập nhật trạng thái');
            console.error('Error updating status:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // Xử lý khi nhân viên chấp nhận đơn hàng tạm
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
            
            // Gọi API để nhận đơn hàng tạm
            await orderService.acceptPendingOrder(idDHT, user.ID_NV);
            
            // Cập nhật lại danh sách đơn hàng tạm
            const updatedPendingOrders = await orderService.getPendingOrders();
            setPendingOrders(updatedPendingOrders || []);
            
            // Cập nhật lại danh sách đơn hàng đã nhận
            const updatedOrders = await orderService.getOrdersByStaff(user.ID_NV);
            setOrders(updatedOrders || []);
            
            alert('Đã nhận đơn hàng thành công!');
        } catch (err) {
            setError(err.message || 'Lỗi khi nhận đơn hàng');
            console.error('Error accepting pending order:', err);
        } finally {
            setLoading(false);
        }
    };const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước file (giới hạn 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setImageError('Kích thước ảnh không được vượt quá 2MB');
            return;
        }
        
        // Kiểm tra định dạng file
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setImageError('Chỉ chấp nhận định dạng JPG, JPEG hoặc PNG');
            return;
        }
        
        try {
            setImageUploading(true);
            setImageError(null);
            
            // Tạo FormData để gửi file
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('userId', user.ID_TK);
            formData.append('userRole', user.Role);
            
            // Gọi API để upload ảnh
            const updatedUser = await authService.updateAvatar(formData);
            
            // Cập nhật thông tin user trong state
            setUser(prev => ({
                ...prev,
                AnhDaiDien: updatedUser.avatarUrl
            }));
            
            // Thông báo thành công
            alert('Cập nhật ảnh đại diện thành công!');
            
        } catch (err) {
            console.error('Error uploading avatar:', err);
            setImageError(err.message || 'Không thể cập nhật ảnh đại diện');
        } finally {
            setImageUploading(false);
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
                            {/* Staff View */}                            {user.Role === 'staff' && (
                                <>                                    <h2 className="order-form-title">Đơn hàng tạm đang chờ xác nhận</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Khách Hàng</th>
                                                <th>Hàng Hóa</th>
                                                <th>Trọng lượng</th>
                                                <th>Người Nhận</th>
                                                <th>Địa chỉ</th>
                                                <th>SĐT</th>
                                                <th>Thu hộ (COD)</th>
                                                <th>Ngày tạo đơn</th>
                                                <th>Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingOrders && pendingOrders.length > 0 ? (
                                                pendingOrders.map((order) => (
                                                    <tr key={order.ID_DHT} className="waiting-order-row">
                                                        <td>{order.MaVanDon}</td>
                                                        <td>{order.TenKhachHang}</td>
                                                        <td>{order.TenHH}</td>
                                                        <td>{order.TrongLuong} kg</td>
                                                        <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                                        <td>{order.DiaChiNN}</td>
                                                        <td>{order.SDT}</td>
                                                        <td>{formatCurrency(order.TienThuHo || 0)}</td>
                                                        <td>{new Date(order.NgayTaoDon).toLocaleDateString()}</td>
                                                        <td>
                                                            <button
                                                                className="accept-order-btn"
                                                                onClick={() => handleAcceptPendingOrder(order.ID_DHT)}
                                                                disabled={loading}
                                                            >
                                                                Nhận đơn hàng
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="10" className="no-data">Không có đơn hàng tạm nào đang chờ xác nhận</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    
                                    <h2 className="order-form-title">Đơn hàng đang chờ xử lý</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Khách Hàng</th>
                                                <th>Hàng Hóa</th>
                                                <th>Trọng lượng</th>
                                                <th>Người Nhận</th>
                                                <th>Địa chỉ</th>
                                                <th>SĐT</th>
                                                <th>Thu hộ (COD)</th>
                                                <th>Ngày tạo đơn</th>
                                                <th>Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>                                            {orders.filter(order => order.TrangThaiDonHang === 'Đang chờ xử lý').map((order) => (
                                                <tr key={order.ID_DH} className="waiting-order-row">
                                                    <td>{order.MaVanDon}</td>
                                                    <td>{order.TenKhachHang}</td>
                                                    <td>{order.TenHH}</td>
                                                    <td>{order.TrongLuong} kg</td>
                                                    <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                                    <td>{order.DiaChiNN}</td>
                                                    <td>{order.SdtNguoiNhan}</td>
                                                    <td>{formatCurrency(order.TienThuHo || 0)}</td>
                                                    <td>{new Date(order.NgayTaoDon).toLocaleDateString()}</td>
                                                    <td>
                                                        <button
                                                            className="accept-order-btn"
                                                            onClick={() => handleAcceptOrder(order.ID_DH)}
                                                            disabled={loading}
                                                        >
                                                            Nhận đơn hàng
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.filter(order => order.TrangThaiDonHang === 'Đang chờ xử lý').length === 0 && (
                                                <tr>
                                                    <td colSpan="10" className="no-data">Không có đơn hàng nào đang chờ xử lý</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    
                                    <h2 className="order-form-title mt-4">Danh sách đơn hàng đang xử lý</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Khách Hàng</th>
                                                <th>Hàng Hóa</th>
                                                <th>Người Nhận</th>
                                                <th>Trạng Thái</th>
                                                <th>Ngày tạo đơn</th>
                                                <th>Hành Động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.filter(order => order.TrangThaiDonHang !== 'Chờ xác nhận').map((order) => (
                                                <tr key={order.ID_DH}>
                                                    <td>{order.MaVanDon}</td>
                                                    <td>{order.TenKhachHang}</td>
                                                    <td>{order.TenHH}</td>
                                                    <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                                    <td>{order.TrangThaiDonHang}</td>
                                                    <td>{new Date(order.NgayTaoDon).toLocaleDateString()}</td>
                                                    <td>                                                        <select
                                                            value={order.TrangThaiDonHang}
                                                            onChange={(e) => handleStatusChange(order.ID_DH, e.target.value)}
                                                            disabled={loading}
                                                        >
                                                            <option value="Đang chờ xử lý">Đang chờ xử lý</option>
                                                            <option value="Đã nhận hàng">Đã nhận hàng</option>
                                                            <option value="Đang lấy">Đang lấy</option>
                                                            <option value="Đã lấy">Đã lấy</option>
                                                            <option value="Đang vận chuyển">Đang vận chuyển</option>
                                                            <option value="Đang giao">Đang giao</option>
                                                            <option value="Đã giao">Đã giao</option>
                                                            <option value="Giao thất bại">Giao thất bại</option>
                                                            <option value="Huỷ giao">Huỷ giao</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.filter(order => order.TrangThaiDonHang !== 'Chờ xác nhận').length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="no-data">Không có đơn hàng nào đang xử lý</td>
                                                </tr>
                                            )}
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
                            {/* User View */}                            {user.Role === 'user' && (
                                <>
                                    <h2 className="order-form-title">Tạo đơn hàng vận chuyển</h2>
                                    {/* Pass user.ID_KH safely */}
                                    <form onSubmit={handleOrderSubmit} className="order-form">
                                        <div className="form-section">
                                            <h3 className="form-section-title">Thông tin người nhận</h3>
                                            <div className="form-group">
                                                <label>Tên người nhận <span className="required">*</span></label>
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
                                                <label>Địa chỉ người nhận <span className="required">*</span></label>
                                                <input
                                                    type="text"
                                                    name="receiverAddress"
                                                    value={order.receiverAddress}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập đầy đủ địa chỉ người nhận"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Số điện thoại người nhận <span className="required">*</span></label>
                                                <input
                                                    type="tel"
                                                    name="receiverPhone"
                                                    value={order.receiverPhone}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập số điện thoại người nhận"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3 className="form-section-title">Thông tin hàng hóa</h3>                                            <div className="form-group">
                                                <label>Tên hàng hóa <span className="required">*</span></label>
                                                <input
                                                    type="text"
                                                    name="productName"
                                                    value={order.productName}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập tên hàng hóa"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Hình ảnh sản phẩm</label>
                                                <div className="product-image-upload">
                                                    <div className="product-image-preview-container">
                                                        {productImagePreview ? (
                                                            <div className="product-image-preview">
                                                                <img 
                                                                    src={productImagePreview} 
                                                                    alt="Ảnh xem trước sản phẩm" 
                                                                    className="preview-image"
                                                                />
                                                                <button 
                                                                    type="button" 
                                                                    className="remove-image-btn"
                                                                    onClick={() => {
                                                                        setProductImagePreview(null);
                                                                        setOrder(prev => ({...prev, productImage: null}));
                                                                    }}
                                                                    disabled={loading}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="upload-placeholder">
                                                                <i className="fas fa-camera"></i>
                                                                <span>Chưa có ảnh</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="upload-controls">
                                                        <label htmlFor="product-image-upload" className="upload-btn">
                                                            <i className="fas fa-upload"></i> Tải lên ảnh
                                                        </label>
                                                        <input
                                                            type="file"
                                                            id="product-image-upload"
                                                            accept="image/jpeg,image/png,image/jpg"
                                                            style={{ display: 'none' }}
                                                            onChange={handleProductImageUpload}
                                                            disabled={loading}
                                                        />
                                                        <small className="upload-info">Chấp nhận: JPG, JPEG, PNG. Tối đa 5MB</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Trọng lượng (kg) <span className="required">*</span></label>
                                                <input
                                                    type="number"
                                                    name="weight"
                                                    value={order.weight}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập trọng lượng hàng hóa"
                                                    min="0.1"
                                                    step="0.1"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Số lượng <span className="required">*</span></label>
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={order.quantity}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập số lượng sản phẩm"
                                                    min="1"
                                                    step="1"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>                                            <div className="form-group">
                                                <label>Loại hàng <span className="required">*</span></label>
                                                <div className="checkbox-group">
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="radio" 
                                                            id="food" 
                                                            name="productType" 
                                                            value="1"
                                                            checked={order.productType === "1"}
                                                            onChange={handleInputChange}
                                                            disabled={loading}
                                                            required
                                                        />
                                                        <label htmlFor="food">Thực phẩm</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="radio" 
                                                            id="clothing" 
                                                            name="productType" 
                                                            value="2"
                                                            checked={order.productType === "2"}
                                                            onChange={handleInputChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="clothing">Quần áo</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="radio" 
                                                            id="electronics" 
                                                            name="productType" 
                                                            value="3"
                                                            checked={order.productType === "3"}
                                                            onChange={handleInputChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="electronics">Đồ điện tử</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="radio" 
                                                            id="cosmetics" 
                                                            name="productType" 
                                                            value="4"
                                                            checked={order.productType === "4"}
                                                            onChange={handleInputChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="cosmetics">Mỹ phẩm</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="radio" 
                                                            id="other" 
                                                            name="productType" 
                                                            value="5"
                                                            checked={order.productType === "5"}
                                                            onChange={handleInputChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="other">Khác</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Tính chất hàng hóa <span className="required">*</span></label>
                                                <div className="checkbox-group">
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="highValue" 
                                                            name="productCharacteristics" 
                                                            value="1" // ID cho Giá trị cao
                                                            checked={order.productCharacteristics?.includes('1')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="highValue">Giá trị cao</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="fragile" 
                                                            name="productCharacteristics" 
                                                            value="2" // ID cho Dễ vỡ
                                                            checked={order.productCharacteristics?.includes('2')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="fragile">Dễ vỡ</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="solid" 
                                                            name="productCharacteristics" 
                                                            value="3" // ID cho Nguyên khối
                                                            checked={order.productCharacteristics?.includes('3')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="solid">Nguyên khối</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="oversized" 
                                                            name="productCharacteristics" 
                                                            value="4" // ID cho Quá khổ
                                                            checked={order.productCharacteristics?.includes('4')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="oversized">Quá khổ</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="liquid" 
                                                            name="productCharacteristics" 
                                                            value="5" // ID cho Chất lỏng
                                                            checked={order.productCharacteristics?.includes('5')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="liquid">Chất lỏng</label>
                                                    </div>
                                                    <div className="checkbox-item">
                                                        <input 
                                                            type="checkbox" 
                                                            id="magnetic" 
                                                            name="productCharacteristics" 
                                                            value="6" // ID cho Từ tính, Pin
                                                            checked={order.productCharacteristics?.includes('6')}
                                                            onChange={handleCharacteristicsChange}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor="magnetic">Từ tính, Pin</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>                                        
                                        <div className="form-section">
                                            <h3 className="form-section-title">Thông tin bổ sung</h3>
                                            <div className="form-group">
                                                <label>Ghi chú (tùy chọn)</label>
                                                <textarea
                                                    name="notes"
                                                    value={order.notes}
                                                    onChange={handleInputChange}
                                                    className="form-textarea"
                                                    placeholder="Nhập ghi chú cho đơn hàng nếu có"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Tiền thu hộ COD (đồng)</label>
                                                <input
                                                    type="number"
                                                    name="codAmount"
                                                    value={order.codAmount || 0}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Nhập số tiền thu hộ (nếu có)"
                                                    min="0"
                                                    step="1000"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section form-summary">
                                            <h3 className="form-section-title">Tóm tắt đơn hàng</h3>                                            <div className="summary-item">
                                                <span>Phí vận chuyển:</span>
                                                <span className="summary-value">{formatCurrency(calculateShippingFee())}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span>Thu hộ COD:</span>
                                                <span className="summary-value">{formatCurrency(order.codAmount || 0)}</span>
                                            </div>
                                            <div className="summary-item total">
                                                <span>Tổng thanh toán:</span>
                                                <span className="summary-value">{formatCurrency(calculateShippingFee() + (parseInt(order.codAmount) || 0))}</span>
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="submit-button" disabled={loading}>
                                                {loading ? 'Đang tạo...' : 'Tạo đơn hàng'}
                                            </button>
                                        </div>
                                    </form>                                    {/* Form thanh toán sau khi đơn hàng được tạo */}
                                    {showPaymentForm && createdOrder && (
                                        <div className="payment-modal-overlay">
                                            <div className="payment-modal">
                                                <div className="payment-modal-header">
                                                    <h3>Thanh toán đơn hàng</h3>
                                                    <button 
                                                        className="close-button" 
                                                        onClick={handleClosePaymentForm}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                
                                                <div className="payment-modal-body">
                                                    <div className="order-summary">
                                                        <h4>Thông tin đơn hàng</h4>
                                                        <div className="summary-row">
                                                            <span className="label">Mã vận đơn:</span>
                                                            <span className="value">{createdOrder.maVanDon}</span>
                                                        </div>
                                                        <div className="summary-row">
                                                            <span className="label">Phí vận chuyển:</span>
                                                            <span className="value">{formatCurrency(calculateShippingFee())}</span>
                                                        </div>
                                                        {parseInt(order.codAmount) > 0 && (
                                                            <div className="summary-row">
                                                                <span className="label">Thu hộ (COD):</span>
                                                                <span className="value">{formatCurrency(parseInt(order.codAmount))}</span>
                                                            </div>
                                                        )}
                                                        <div className="summary-row total">
                                                            <span className="label">Tổng thanh toán:</span>
                                                            <span className="value">{formatCurrency(calculateShippingFee())}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="payment-methods">
                                                        <h4>Chọn phương thức thanh toán</h4>
                                                        <div className="payment-options">
                                                            <button 
                                                                className="payment-option-btn" 
                                                                onClick={() => handlePayment('Chuyển khoản ngân hàng')}
                                                                disabled={loading}
                                                            >
                                                                <span className="payment-icon">🏦</span>
                                                                Chuyển khoản ngân hàng
                                                            </button>
                                                            
                                                            <button 
                                                                className="payment-option-btn" 
                                                                onClick={() => handlePayment('Ví điện tử MoMo')}
                                                                disabled={loading}
                                                            >
                                                                <span className="payment-icon">📱</span>
                                                                Ví điện tử MoMo
                                                            </button>
                                                            
                                                            <button 
                                                                className="payment-option-btn" 
                                                                onClick={() => handlePayment('VNPay QR')}
                                                                disabled={loading}
                                                            >
                                                                <span className="payment-icon">🔄</span>
                                                                VNPay QR
                                                            </button>
                                                            
                                                            <button 
                                                                className="payment-option-btn" 
                                                                onClick={() => handlePayment('Tiền mặt khi nhận hàng')}
                                                                disabled={loading}
                                                            >
                                                                <span className="payment-icon">💵</span>
                                                                Tiền mặt khi nhận hàng
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {loading && (
                                                    <div className="payment-loading">
                                                        <span className="loading-spinner"></span>
                                                        <p>Đang xử lý thanh toán...</p>
                                                    </div>
                                                )}
                                                
                                                {error && (
                                                    <div className="payment-error">
                                                        {error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <h2 className="order-form-title">Lịch sử đơn hàng</h2>
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Mã Vận Đơn</th>
                                                <th>Hàng Hóa</th>
                                                <th>Người Nhận</th>
                                                <th>Địa Chỉ Nhận</th>
                                                <th>Trạng Thái</th>
                                                <th>Phí Giao</th>
                                                <th>Ngày Tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userOrders.length > 0 ? (
                                                userOrders.map((order) => (
                                                    <tr key={order.ID_DH}>
                                                        <td>{order.MaVanDon}</td>
                                                        <td>{order.TenHH}</td>
                                                        <td>{order.TenNguoiNhan || order.Ten_NN}</td>
                                                        <td>{order.DiaChiNN}</td>
                                                        <td>{order.TrangThaiDonHang}</td>
                                                        <td>{formatCurrency(order.PhiGiaoHang || 0)}</td>
                                                        <td>{new Date(order.NgayTaoDon).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="no-data">Bạn chưa có đơn hàng nào</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}                    {/* Profile Section with Image Upload */}
                    {activeItem === 'profile' && user && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Thông tin cá nhân</h2>
                            <div className="profile-section">
                                <div className="profile-image-container">
                                    <div className="profile-image-wrapper">
                                        <img 
                                            src={user.AnhDaiDien || 'https://via.placeholder.com/150'} 
                                            alt="Ảnh đại diện"
                                            className="profile-image"
                                        />
                                        <div className="profile-image-overlay">
                                            <label htmlFor="profile-image-upload" className="profile-image-button">
                                                <i className="fas fa-camera"></i>
                                                Cập nhật
                                            </label>
                                            <input 
                                                type="file" 
                                                id="profile-image-upload" 
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleImageUpload}
                                                disabled={imageUploading}
                                            />
                                        </div>
                                        {imageUploading && (
                                            <div className="profile-image-loading">
                                                <div className="spinner"></div>
                                            </div>
                                        )}
                                    </div>
                                    {imageError && <p className="profile-image-error">{imageError}</p>}
                                </div>
                                
                                <div className="profile-details">
                                    <p><strong>Họ tên:</strong> {user.HoTen}</p>
                                    <p><strong>Email:</strong> {user.Email}</p>
                                    <p><strong>Điện thoại:</strong> {user.SDT}</p>
                                    <p><strong>Địa chỉ:</strong> {user.DiaChi}</p>
                                    <p><strong>Vai trò:</strong> {user.Role === 'staff' ? 'Nhân viên' : 'Khách hàng'}</p>
                                </div>
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
