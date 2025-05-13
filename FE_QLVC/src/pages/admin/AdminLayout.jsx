import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  UsersIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { UserManagement } from "./UserManagement";
import { OrderManagement } from "./OrderManagement";
import { useAuth } from "../../hooks/useAuth";
import RevenueReport from "./reports/RevenueReport";
import StaffReportManagement from "./StaffReportManagement";
import FinancialReportManagement from "./FinancialReportManagement";
import NotificationManagement from "./reports/NotificationManagement";
import { toast } from 'react-toastify';
import socketService from '../../services/socketService';
import { notificationService } from '../../services/notificationService';
import XacNhanDonHang from "./xacnhan";
import './AdminNotification.css';
import './AdminSidebar.css';

// Menu structure (có thể tách ra file riêng)
const MENU_STRUCTURE = [
  {
    id: "management",
    name: "Quản lý",
    icon: BuildingStorefrontIcon,
    subItems: [
      { id: "shipping-management", name: "Quản lý vận đơn", icon: ClipboardDocumentListIcon, path: "/admin/orders" },
      { id: "pending-orders", name: "Đơn hàng cần xử lý", icon: ArchiveBoxIcon, path: "/admin/pending" },
      { id: "users", name: "Quản lý tài khoản", icon: UsersIcon, path: "/admin/users" },
    ],
  },  {
    id: "reports",
    name: "Báo cáo thống kê",
    icon: DocumentChartBarIcon,
    subItems: [
      { id: "revenue-report", name: "Thống kê tiền hàng", icon: CurrencyDollarIcon, path: "/admin/reports/revenue" },
      { id: "financial-report", name: "Báo cáo tài chính", icon: WrenchScrewdriverIcon, path: "/admin/reports/financial" },
      { id: "staff-report", name: "Báo cáo nhân viên", icon: UserGroupIcon, path: "/admin/reports/staff" },
      { id: "notification-management", name: "Quản lý thông báo", icon: BellIcon, path: "/admin/reports/notifications" },
    ],
  },
 
];

// PendingOrders component (đặt TRƯỚC CONTENT_MAP)
const PendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    const unsubNewOrder = socketService.onNewOrder((order) => {
      setPendingOrders(prev => [...prev, order]);
      toast.info(`Đơn hàng mới ${order.maVanDon || order.MaVanDon || 'N/A'} vừa được tạo!`);
    });
    return () => {
      unsubNewOrder && unsubNewOrder();
    };
  }, []);

  const handleConfirmPendingOrder = async (order) => {
    if (window.confirm(`Xác nhận tiếp nhận đơn hàng mới: ${order.maVanDon || order.MaVanDon || 'N/A'}?`)) {
      // TODO: Gọi API lưu vào database tạm nếu cần
      setPendingOrders(prev => prev.filter(o => o !== order));
      toast.success('Đã xác nhận đơn hàng!');
    }
  };

  return (
    <div className="pending-orders-alert">
      <h3>Đơn hàng mới chờ xác nhận:</h3>
      {pendingOrders.length === 0 ? (
        <div>Không có đơn hàng chờ xác nhận.</div>
      ) : (
        <ul>
          {pendingOrders.map((order, idx) => (
            <li key={order.maVanDon || order.MaVanDon || idx} className="pending-order-item">
              <span>
                Mã vận đơn: <b>{order.maVanDon || order.MaVanDon || 'N/A'}</b> - Người nhận: <b>{order.receiverName || order.TenNguoiNhan || 'N/A'}</b>
              </span>
              <button
                className="confirm-pending-btn"
                onClick={() => handleConfirmPendingOrder(order)}
              >
                Xác nhận
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Component mapping để render nội dung chính
const CONTENT_MAP = {
  users: UserManagement,
  "shipping-management": OrderManagement,
  "pending-orders": XacNhanDonHang,
  "revenue-report": RevenueReport,
  "financial-report": FinancialReportManagement,
  "staff-report": StaffReportManagement,
  "notification-management": NotificationManagement,
  // Thêm các mapping khác khi cần
};

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get saved state from localStorage or default to false
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSidebarHidden, setIsSidebarHidden] = useState(() => {
    // Get saved state from localStorage or default to false
    const saved = localStorage.getItem('admin-sidebar-hidden');
    return saved ? JSON.parse(saved) : false;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth(); // Get logout function from auth context  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (auth && auth.user && auth.user.id) {
        try {
          const response = await notificationService.getUserNotifications(auth.user.id);
          setNotifications(response);
          const unread = response.filter(noti => noti.DaDoc === 0).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };
    
    fetchNotifications();
    
    // Set up socket listener for new notifications
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info('Bạn có thông báo mới');
    };
    
    socketService.onNewNotification(handleNewNotification);
    
    return () => {
      socketService.offNewNotification(handleNewNotification);
    };
  }, [auth]);
  
  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationContainer = document.querySelector('.notification-container');
      if (notificationContainer && !notificationContainer.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);
  
  // Save hidden state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-hidden', JSON.stringify(isSidebarHidden));
  }, [isSidebarHidden]);

  // Đồng bộ activeTab với URL
  useEffect(() => {
    const path = location.pathname;
    let matchedItem = null;

    // Handle special cases for edit routes
    if (path.includes('/admin/users/edit/')) {
      setActiveTab('users-edit');
      return;
    }

    MENU_STRUCTURE.forEach((category) => {
      const item = category.subItems.find((sub) => path.startsWith(sub.path));
      if (item) {
        matchedItem = item;
        setOpenCategories((prev) => ({ ...prev, [category.id]: true }));
      }
    });

    if (matchedItem) {
      setActiveTab(matchedItem.id);
    } else {
      // Default: điều hướng đến trang đầu tiên
      const defaultItem = MENU_STRUCTURE[0].subItems[0];
      setActiveTab(defaultItem.id);
      setOpenCategories({ [MENU_STRUCTURE[0].id]: true });
      navigate(defaultItem.path, { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleSubItemClick = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
    setIsMobileMenuOpen(false);
  };
  const handleLogout = () => {
    // Call the logout function from auth context
    logout();
    // Navigate to login page
    navigate("/login", { replace: true });
  };
    const handleMarkAllAsRead = async () => {
    if (auth && auth.user && auth.user.id) {
      try {
        await notificationService.markUserNotificationsAsRead(auth.user.id);
        setNotifications(prev => prev.map(noti => ({ ...noti, DaDoc: 1 })));
        setUnreadCount(0);
        toast.success('Đã đánh dấu tất cả là đã đọc');
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        toast.error('Không thể đánh dấu thông báo');
      }
    }
  };
  
  const handleNotificationClick = async (notification) => {
    // If notification is unread, mark it as read
    if (notification.DaDoc === 0) {
      try {
        // You need to implement this method in the notificationService
        await notificationService.markAsRead(notification.ID_TB);
        
        // Update local state
        setNotifications(prev => 
          prev.map(noti => 
            noti.ID_TB === notification.ID_TB ? { ...noti, DaDoc: 1 } : noti
          )
        );
        
        // Decrement unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to related order if applicable
    if (notification.ID_DH) {
      setIsNotificationOpen(false);
      navigate(`/admin/orders?id=${notification.ID_DH}`);
    }
  };
  // Component tái sử dụng cho sub-item
  const SidebarSubItem = ({ item }) => (
    <button
      onClick={() => handleSubItemClick(item)}
      className={`sidebar-sub-item ${activeTab === item.id ? "active" : ""}`}
      type="button"
    >
      {item.icon && <item.icon className="sidebar-icon" />}
      <span>{item.name}</span>
    </button>
  );

  // Component tái sử dụng cho category
  const SidebarCategory = ({ category }) => (
    <div className="sidebar-category">
      <button onClick={() => toggleCategory(category.id)} className="sidebar-category-toggle">
        <category.icon className="sidebar-icon" />
        <span className="sidebar-category-name">{category.name}</span>
        {openCategories[category.id] ? (
          <ChevronUpIcon className="sidebar-chevron-icon" />
        ) : (
          <ChevronDownIcon className="sidebar-chevron-icon" />
        )}
      </button>
      {openCategories[category.id] && (
        <div className="sidebar-submenu">
          {category.subItems.map((item) => (
            <SidebarSubItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  // Render nội dung chính
  const ActiveContent = CONTENT_MAP[activeTab] || (() => <div>Chưa có nội dung cho mục này</div>);

  return (
    <div className="admin-layout-container">
      {/* Header */}      <header className="admin-header-fixed">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <button
              onClick={() => setIsSidebarHidden(!isSidebarHidden)}
              className="toggle-sidebar-visibility-button"
              title={isSidebarHidden ? "Hiện sidebar" : "Ẩn sidebar"}
            >
              {isSidebarHidden ? <Bars3Icon className="icon-base" /> : <XMarkIcon className="icon-base" />}
            </button>
          </div>
          <div className="admin-header-right">            <div className="search-container">
              <input
                type="text"
                placeholder="Tra cứu đơn hàng"
                className="search-input"
              />
              <MagnifyingGlassIcon className="search-icon" />
            </div>
            <div className="notification-container">
              <button 
                className="notification-button"
                onClick={() => setIsNotificationOpen(prev => !prev)}
              >
                <BellIcon className="icon-base" />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {isNotificationOpen && (
                <div className="notification-dropdown">                  <div className="notification-dropdown-header">
                    <span>Thông báo của bạn</span>
                    <div className="notification-header-actions">
                      {unreadCount > 0 && (
                        <button 
                          className="mark-read-btn"
                          onClick={handleMarkAllAsRead}
                          title="Đánh dấu tất cả là đã đọc"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button 
                        className="view-all-btn"
                        onClick={() => {
                          navigate("/admin/reports/notifications");
                          setIsNotificationOpen(false);
                        }}
                      >
                        Xem tất cả
                      </button>
                    </div>
                  </div>
                  <div className="notification-dropdown-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">Không có thông báo</div>
                    ) : (                      notifications.slice(0, 5).map((noti, idx) => (
                        <div 
                          key={noti.ID_TB || idx} 
                          className={`notification-item ${noti.DaDoc === 0 ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(noti)}
                        >
                          <div className="notification-content">
                            {noti.NoiDung || 'Thông báo mới'}
                          </div>
                          <div className="notification-time">
                            {new Date(noti.NgayTB).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              <ArrowLeftOnRectangleIcon className="icon-base icon-logout" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? "visible" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />      {/* Floating toggle button for hidden sidebar */}
      <button
        className="floating-sidebar-toggle"
        onClick={() => setIsSidebarHidden(false)}
        title="Hiện sidebar"
      >
        <Bars3Icon width={16} height={16} />
      </button>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""} ${isSidebarHidden ? "hidden" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2 className="sidebar-title">QLVC Admin</h2>
            <button 
              className="toggle-sidebar-button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
              {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          {MENU_STRUCTURE.map((category) => (
            <SidebarCategory key={category.id} category={category} />
          ))}          
          <button 
            onClick={handleLogout} 
            className="sidebar-sub-item mobile-logout-button"
            type="button"
          >
            <ArrowLeftOnRectangleIcon className="sidebar-icon" />
            <span>Đăng xuất</span>
          </button>
        </nav>
      </aside>      {/* Main Content */}
      <main className={`admin-main-content ${isCollapsed ? "sidebar-collapsed" : ""} ${isSidebarHidden ? "sidebar-hidden" : ""}`}>
        <div className="main-content-inner">
          <ActiveContent />
        </div>
      </main>
    </div>
  );
};
