import React, { useState } from "react";
import { UserManagement } from "./UserManagement";
import { ProductManagement } from "./ProductManagement";
import {
  UserGroupIcon,
  CubeIcon,
  TruckIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("users");

  const menuItems = [
    { id: "users", name: "Quản lý tài khoản", icon: UserGroupIcon },
    { id: "products", name: "Quản lý hàng hóa", icon: CubeIcon },
    { id: "shipping", name: "Quản lý vận chuyển", icon: TruckIcon },
    { id: "orders", name: "Quản lý đơn hàng", icon: DocumentTextIcon },
    { id: "reports", name: "Báo cáo thống kê", icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="fixed-header">
        <div className="admin-header">
          <h1 className="admin-title">
            {menuItems.find(item => item.id === activeTab)?.name || "Dashboard"}
          </h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`admin-sidebar-item ${activeTab === item.id ? "active" : ""}`}
            >
              <item.icon className="admin-sidebar-icon" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div>
          {activeTab === "users" && <UserManagement />}
          {activeTab === "products" && <ProductManagement />}
          {/* Add other components for shipping, orders, and reports when ready */}
        </div>
      </main>
    </div>
  );
};
