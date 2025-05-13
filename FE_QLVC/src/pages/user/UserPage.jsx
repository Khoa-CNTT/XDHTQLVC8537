import React, { useEffect, useState, useCallback } from 'react';
import { orderService } from '../../services/orderService.js'; 
import { authService } from '../../services/authService.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserView from '../../components/user/UserView';
import UserHistory from '../../components/user/UserHistory';
import UserSetting from '../../components/user/UserSetting';
import ProfileUpdateForm from '../../components/user/ProfileUpdateForm';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import { notificationService } from '../../services/notificationService';
import UserNotification from '../../components/user/UserNotification';

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
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    
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

    // Ngăn submit lặp khi đang gửi đơn hàng (cả cash và online)
    const [isSubmitting, setIsSubmitting] = useState(false);    // Memoize fetchUserData to prevent recreation on every render
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
            // let pendingOrdersPromise = Promise.resolve([]);

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

            return combinedUserData;
        } catch (err) {
            console.error('Error fetching user page data:', err);
            setError(`Lỗi khi tải dữ liệu: ${err.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);    useEffect(() => {
        // Check auth state from context
        if (!auth.isLoading) {
            if (!auth.isAuthenticated || !auth.userId) {
                navigate('/login', { replace: true });
            } else {
                // Fetch data if authenticated
                fetchUserData(auth.userId, auth.userRole);
            }
        }
    }, [auth.isLoading, auth.isAuthenticated, auth.userId, auth.userRole, navigate, fetchUserData]);    // Fetch notifications for the user
    const fetchUserNotifications = useCallback(async (userId) => {
        try {
            if (!userId) return;
            const notificationsData = await notificationService.getUserNotifications(userId);
            setNotifications(notificationsData);
            // Count unread notifications
            const unreadNotificationsCount = notificationsData.filter(n => n.DaDoc === 0).length;
            setUnreadCount(unreadNotificationsCount);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, []);
    
    // Set up socket for real-time notification updates
    useEffect(() => {
        if (!auth.isAuthenticated || !user || !user.ID_KH) return;
        
        // Set up socket listeners
        const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
            if (data.userID === user.ID_KH) {
                toast.success(`Đơn hàng ${data.orderCode} đã được nhân viên tiếp nhận!`);
                fetchUserNotifications(user.ID_KH);
            }
        });
        
        const unsubOrderStatusChanged = socketService.onOrderStatusChanged((data) => {
            if (data.userID === user.ID_KH) {
                toast.info(`Trạng thái đơn hàng ${data.orderCode} đã được cập nhật thành: ${data.status}`);
                fetchUserNotifications(user.ID_KH);
            }
        });
        
        const unsubNotification = socketService.onNotification((data) => {
            if (data.userID === user.ID_KH) {
                toast.info(data.message);
                fetchUserNotifications(user.ID_KH);
            }
        });
        
        // Add listener for order:confirmed events to handle payment confirmations
        const unsubOrderConfirmed = socketService.onOrderConfirmed((data) => {
            console.log('Received order confirmation:', data);
            
            // Ensure this notification is for the current user
            if (data.userId == user.ID_KH || !data.userId) {
                const orderCode = data.orderIdAlternatives?.maVanDon || 'N/A';
                const message = data.isOnlinePayment 
                    ? `Thanh toán cho đơn hàng ${orderCode} đã được xác nhận.`
                    : `Đơn hàng ${orderCode} đã được xác nhận.`;
                    
                toast.success(message, {
                    icon: "✅",
                    autoClose: 6000
                });
                
                // Refresh notifications
                fetchUserNotifications(user.ID_KH);
            }
        });
        
        // Initial fetch of notifications
        if (user.ID_KH) {
            fetchUserNotifications(user.ID_KH);
        }
        
        // Hủy đăng ký các lắng nghe khi component unmount
        return () => {
            unsubOrderAccepted();
            unsubOrderStatusChanged();
            unsubNotification();
            unsubOrderConfirmed();
        };
    }, [auth.isAuthenticated, user, fetchUserNotifications]);
    
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
            // Nếu user đang chờ xác nhận chuyển khoản thì đóng modal chờ
            if (window.setWaitingAdminConfirm) {
                window.setWaitingAdminConfirm(false);
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

        // Đăng ký lắng nghe sự kiện thông báo chung (có thể dùng cho xác nhận chuyển khoản)
        const unsubNotification = socketService.onNotification((data) => {
            if (data && data.type === 'order_accepted' && user.Role === 'user' && user.ID_KH) {
                // Đơn hàng online đã được admin xác nhận chuyển khoản
                orderService.getOrdersByCustomer(user.ID_KH)
                    .then(updatedOrders => {
                        setUserOrders(updatedOrders || []);
                        toast.success('Admin đã xác nhận chuyển khoản, đơn hàng của bạn đã được tiếp nhận!');
                    })
                    .catch(error => console.error('Lỗi khi cập nhật danh sách đơn hàng:', error));
                // Đóng modal chờ xác nhận nếu có
                if (window.setWaitingAdminConfirm) {
                    window.setWaitingAdminConfirm(false);
                }
            }
        });
        
        // Hủy đăng ký các lắng nghe khi component unmount
        return () => {
            unsubOrderAccepted();
            unsubOrderStatusChanged();
            unsubNotification();
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
    // Khi đóng modal thanh toán, reset cả createdOrder và showPaymentForm
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
    };    // Xử lý nhất quán cho tất cả các phương thức thanh toán
    const handleOrderSubmit = async (e, options = {}) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        if (e) e.preventDefault();

        // Xử lý đóng modal nếu được yêu cầu
        if (options.closeModal) {
            setShowPaymentForm(false);
            setIsSubmitting(false);
            return;
        }

        if (!user || !user.ID_KH) {
            setError('Không thể tạo đơn hàng: thiếu thông tin khách hàng.');
            setIsSubmitting(false);
            return;
        }
        setError(null);
        setLoading(true);
        try {
            // Xác định ID tính chất hàng hóa dựa trên tính chất được chọn
            let ID_TCHH = 0;
            if (order.productCharacteristics && order.productCharacteristics.length > 0) {
                ID_TCHH = Math.max(...order.productCharacteristics.map(id => parseInt(id)));
            }
            if (ID_TCHH === 0) ID_TCHH = 1;
            const productData = {
                tenHH: order.productName,
                trongLuong: parseFloat(order.weight) || 0.1,
                ID_LHH: parseInt(order.productType) || 1,
                ID_TCHH: ID_TCHH,
                donGia: 0,
                soLuong: parseInt(order.quantity) || 1,
                image: 'default.jpg'
            };
            const orderData = {
                khachHangId: user.ID_KH,
                hangHoa: productData,
                nguoiNhan: {
                    ten: order.receiverName,
                    diaChi: order.receiverAddress,
                    sdt: order.receiverPhone
                },
                phiGiaoHang: calculateShippingFee(),
                tienShip: calculateShippingFee(),
                tienThuHo: parseInt(order.codAmount) || 0,
                ghiChu: order.notes || '',
                trangThaiDonHang: 'Đang chờ xử lý',
                paymentMethod: options.paymentMethod || 'cash'
            };
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
            // Gửi đơn hàng lên server
            const response = await orderService.createOrder(orderData);
            // Reset form sau khi tạo đơn thành công
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
                quantity: 1
            });
            
            // Cập nhật danh sách đơn hàng
            const updatedOrders = await orderService.getOrdersByCustomer(user.ID_KH);
            setUserOrders(updatedOrders || []);
            // Lưu thông tin đơn hàng đã tạo
            setCreatedOrder(response.data);
            
            // Xử lý dựa theo phương thức thanh toán
            if (options.paymentMethod === "online") {
                setShowPaymentForm(true);
            } else {
                setShowPaymentForm(false);
            }
            
            return response;
        } catch (err) {
            setError(err.message || 'Lỗi khi tạo đơn hàng');
            console.error('Error creating order:', err);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };    const handleLogout = () => {
        logout();
    };

    // Effect to fetch notifications when user data is available
    useEffect(() => {
        if (user && user.ID_KH) {
            fetchUserNotifications(user.ID_KH);
        }
    }, [user, fetchUserNotifications]);

    // Handle notification bell click
    const handleNotificationClick = async () => {
        setIsNotificationOpen(true);
        // Mark all notifications as read when opening
        if (user && user.ID_KH && notifications.some(n => n.DaDoc === 0)) {
            try {
                await notificationService.markUserNotificationsAsRead(user.ID_KH);
                // Update local state to mark all as read
                setNotifications(prev => prev.map(n => ({ ...n, DaDoc: 1 })));
                setUnreadCount(0);
            } catch (err) {
                console.error('Error marking notifications as read:', err);
            }
        }
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

            {/* Main content */}            <div className="flex-1">
                <header className="user-header">
                    <div className="user-header-content">
                        <h1 className="user-title">
                            Trang Người Dùng
                        </h1>
                        <div className="user-header-right">                            {/* Notification bell */}
                            <button
                                className="notification-bell"
                                onClick={handleNotificationClick}
                                aria-label="Xem thông báo"
                            >
                                <div style={{ position: 'relative' }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className="notification-title">Thông báo</span></button>                            {user && (
                                <div className="user-info">
                                    <p className="user-greeting">
                                        Xin chào, {user.HoTen || 'Người dùng'}
                                    </p>
                                    <p className="user-address">{user.DiaChi || 'Không có địa chỉ'}</p>
                                </div>
                            )}
                        </div>
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
                    )}                    {/* Profile Section */}
                    {activeItem === 'profile' && user && (
                        <div className="order-form-container">
                            <h2 className="order-form-title">Thông tin cá nhân</h2>
                            <div className="profile-section">
                                <div className="profile-details profile-details-full">
                                    <p><strong>Họ tên:</strong> {user.HoTen}</p>
                                    <p><strong>Email:</strong> {user.Email}</p>
                                    <p><strong>Điện thoại:</strong> {user.SDT}</p>
                                    <p><strong>Địa chỉ:</strong> {user.DiaChi}</p>
                                    <p><strong>Vai trò:</strong> Khách hàng</p>
                                </div>
                            </div>
                            
                            {/* Form cập nhật thông tin cá nhân */}
                            <div className="profile-update-section">
                                <ProfileUpdateForm 
                                    user={user}
                                    onUpdateSuccess={(updatedUser) => {
                                        setUser(updatedUser);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Settings Section using UserSetting component */}
                    {activeItem === 'settings' && (
                        <div className="order-form-container">
                            <UserSetting user={user} userOrders={userOrders} />
                        </div>                    )}
                </main>
            </div>
            
            {/* Notification Panel */}
            {isNotificationOpen && (
                <UserNotification
                    notifications={notifications}
                    onClose={() => setIsNotificationOpen(false)}
                />
            )}
        </div>
    );
};

export default UserPage;