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
import { useAuth } from "../../contexts/AuthContext"; // Add import for useAuth

// Menu structure (có thể tách ra file riêng)
const MENU_STRUCTURE = [
  {
    id: "management",
    name: "Quản lý",
    icon: BuildingStorefrontIcon,
    subItems: [
      { id: "shipping-management", name: "Quản lý vận đơn", icon: ClipboardDocumentListIcon, path: "/admin/shipping" },
      { id: "pending-orders", name: "Đơn hàng cần xử lý", icon: ArchiveBoxIcon, path: "/admin/orders/pending" },
      { id: "users", name: "Quản lý tài khoản", icon: UsersIcon, path: "/admin/users" },
    ],
  },
  {
    id: "reports",
    name: "Báo cáo thống kê",
    icon: DocumentChartBarIcon,
    subItems: [
      { id: "revenue-report", name: "Thống kê tiền hàng", icon: CurrencyDollarIcon, path: "/admin/reports/revenue" },
      { id: "operations-report", name: "Báo cáo vận hành", icon: WrenchScrewdriverIcon, path: "/admin/reports/operations" },
      { id: "hr-report", name: "Báo cáo nhân sự", icon: UserGroupIcon, path: "/admin/reports/hr" },
    ],
  },
  {
    id: "settings",
    name: "Cài đặt tài khoản",
    icon: Cog6ToothIcon,
    subItems: [
      { id: "profile", name: "Quản lý thông tin cá nhân", icon: UserCircleIcon, path: "/admin/settings/profile" },
      { id: "change-password", name: "Đổi mật khẩu", icon: KeyIcon, path: "/admin/settings/password" },
    ],  },
];

// Component mapping để render nội dung chính
const CONTENT_MAP = {
  users: UserManagement,
  // Thêm các mapping khác khi cần
};

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); // Get logout function from auth context

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

  // Component tái sử dụng cho sub-item
  const SidebarSubItem = ({ item }) => (
    <button
      onClick={() => handleSubItemClick(item)}
      className={`sidebar-sub-item ${activeTab === item.id ? "active" : ""}`}
    >
      <item.icon className="sidebar-icon" />
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
      {/* Header */}
      <header className="admin-header-fixed">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button"
            >
              {isMobileMenuOpen ? <XMarkIcon className="icon-base" /> : <Bars3Icon className="icon-base" />}
            </button>
            {/* Optional: Add Title/Logo here if needed */}
          </div>
          <div className="admin-header-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Tra cứu đơn hàng"
                className="search-input"
              />
              <MagnifyingGlassIcon className="search-icon" />
            </div>
            <button className="notification-button">
              <BellIcon className="icon-base" />
            </button>
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
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">QLVC Admin</h2>
        </div>
        <nav className="sidebar-nav">
          {MENU_STRUCTURE.map((category) => (
            <SidebarCategory key={category.id} category={category} />
          ))}
          <button onClick={handleLogout} className="sidebar-sub-item mobile-logout-button">
            <ArrowLeftOnRectangleIcon className="sidebar-icon" />
            <span>Đăng xuất</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <div className="main-content-inner">
          <ActiveContent />
        </div>
      </main>
    </div>
  );
};