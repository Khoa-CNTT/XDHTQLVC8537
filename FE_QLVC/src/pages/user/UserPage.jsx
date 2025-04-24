import React, { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../services/orderService.js'; 
import { authService } from '../../services/authService.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserView from '../../components/user/UserView';
import UserHistory from '../../components/user/UserHistory';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';

import './UserPage.css';

const UserPage = () => {
    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const [activeItem, setActiveItem] = useState('main');
    const [user, setUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]); // Customer orders
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState(null);
    
    const [order, setOrder] = useState({
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
        quantity: 1
    });
    const [productImagePreview, setProductImagePreview] = useState(null);

    // Memoize fetchUserData to prevent recreation on every render
    const fetchUserData = useCallback(async (userId, userRole) => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            // Fetch role-specific details (includes Email, SDT from backend now)
            let specificUserData = null;
            if (userRole === 'user') {
                specificUserData = await authService.getKhachHangByTK(userId);
            }

            if (!specificUserData) {
                throw new Error('Không thể tải thông tin chi tiết người dùng.');
            }

            // Combine base auth info with specific details
            const combinedUserData = {
                ID_TK: userId,
                Role: userRole,
                ...specificUserData,
                // Ensure HoTen is set correctly
                HoTen: specificUserData.Ten_KH,
            };
            setUser(combinedUserData); // Set the detailed user state
            
            // Fetch additional data only after user data is confirmed
            let ordersPromise;

            if (userRole === 'user' && combinedUserData.ID_KH) {
                ordersPromise = orderService.getOrdersByCustomer(combinedUserData.ID_KH);
            } else {
                ordersPromise = Promise.resolve([]);
            }
            
            // Wait for orders data
            const ordersData = await ordersPromise;
            
            if (userRole === 'user') {
                setUserOrders(ordersData || []);
            }

        } catch (err) {
            console.error('Error fetching user page data:', err);
            setError(`Lỗi khi tải dữ liệu: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check auth state from context
        if (!auth.isLoading) {
            if (!auth.isAuthenticated || !auth.userId) {
                navigate('/login', { replace: true });
            } else {
                // Fetch data if authenticated
                fetchUserData(auth.userId, auth.userRole);
            }
        }
    }, [auth.isLoading, auth.isAuthenticated, auth.userId, auth.userRole, navigate, fetchUserData]);
    
    // Lắng nghe sự kiện socket.io để cập nhật dữ liệu theo thời gian thực
    useEffect(() => {
        if (!auth.isAuthenticated || !user) return;
        
        // Đăng ký lắng nghe sự kiện đơn hàng được tiếp nhận
        const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
            console.log('Nhận được sự kiện đơn hàng được tiếp nhận:', data);
            
            if (user.Role === 'user' && user.ID_KH) {
                // Cập nhật danh sách đơn hàng của khách hàng
                orderService.getOrdersByCustomer(user.ID_KH)
                    .then(updatedOrders => {
                        setUserOrders(updatedOrders || []);
                        toast.info('Đơn hàng của bạn đã được nhân viên tiếp nhận!');
                    })
                    .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng:', error));
            }
        });
        
        // Đăng ký lắng nghe sự kiện thay đổi trạng thái đơn hàng
        const unsubOrderStatusChanged = socketService.onOrderStatusChanged((data) => {
            console.log('Nhận được sự kiện trạng thái đơn hàng thay đổi:', data);
            
            if (user.Role === 'user' && user.ID_KH) {
                orderService.getOrdersByCustomer(user.ID_KH)
                    .then(updatedOrders => {
                        setUserOrders(updatedOrders || []);
                        toast.info(`Đơn hàng của bạn đã được cập nhật trạng thái: ${data.newStatus}`);
                    })
                    .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng:', error));
            }
        });
        
        // Hủy đăng ký các lắng nghe khi component unmount
        return () => {
            unsubOrderAccepted();
            unsubOrderStatusChanged();
        };
    }, [auth.isAuthenticated, user]);

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    // All the existing handler functions remain the same
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));
    };

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
    
    // Rest of handler functions
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
    };

    const handleRemoveProductImage = () => {
        setProductImagePreview(null);
        setOrder(prev => ({
            ...prev,
            productImage: null
        }));
    };

    // Hàm tính phí vận chuyển
    const calculateShippingFee = () => {
        const weight = parseFloat(order.weight) || 0;
        const baseFee = 30000;
        const additionalFee = Math.ceil(weight) * 5000;
        return baseFee + additionalFee;
    };

    // Rest of the handlers kept the same...
    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
        setCreatedOrder(null);
    };

    const handlePayment = async (paymentMethod) => {
        // Existing handlePayment code
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
    };

    const handleOrderSubmit = async (e) => {
        // Existing handleOrderSubmit code
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
                },                  
                phiGiaoHang: calculateShippingFee(),
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
    };

    const handleImageUpload = async (e) => {
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
                        className={`user-sidebar-item ${activeItem === 'orders' ? 'active' : ''}`}
                        onClick={() => handleItemClick('orders')}
                    >
                        <span className="user-sidebar-icon">📦</span>
                        Lịch sử đơn hàng
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
                        onClick={handleLogout}
                    >
                        <span className="user-sidebar-icon">🚪</span>
                        Đăng xuất
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1">
                <header className="user-header">
                    <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
                        <h1 className="user-title">
                            Trang Người Dùng
                        </h1>
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
                    {error && <div className="message error-message mb-4">{error}</div>}

                    {/* Order History View when selected in main content */}
                    {activeItem === 'orders' && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Lịch sử đơn hàng</h2>
                            {/* Replace the duplicate table implementation with the UserHistory component */}
                            <UserHistory userOrders={userOrders} />
                        </div>
                    )}

                    {/* Main View */}
                    {activeItem === 'main' && user && (
                        <div className="order-form-container">
                            <UserView 
                                user={user}
                                order={order}
                                handleInputChange={handleInputChange}
                                handleCharacteristicsChange={handleCharacteristicsChange}
                                handleProductImageUpload={handleProductImageUpload}
                                handleRemoveProductImage={handleRemoveProductImage}
                                productImagePreview={productImagePreview}
                                calculateShippingFee={calculateShippingFee}
                                handleOrderSubmit={handleOrderSubmit}
                                loading={loading}
                                error={error}
                                showPaymentForm={showPaymentForm}
                                createdOrder={createdOrder}
                                handleClosePaymentForm={handleClosePaymentForm}
                                handlePayment={handlePayment}
                                userOrders={userOrders}
                            />
                        </div>
                    )}

                    {/* Profile Section */}
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
                                    <p><strong>Vai trò:</strong> Khách hàng</p>
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
        </div>
    );
};

export default UserPage;