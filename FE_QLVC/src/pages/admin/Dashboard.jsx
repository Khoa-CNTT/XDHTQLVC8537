import React from "react";
import { ChartBarIcon, UsersIcon, CubeIcon, TruckIcon } from '@heroicons/react/24/outline';

export const Dashboard = () => {
    // Sample data for dashboard
    const stats = [
        { name: "Người dùng", value: "126", icon: UsersIcon, color: "bg-blue-500" },
        { name: "Sản phẩm", value: "84", icon: CubeIcon, color: "bg-green-500" },
        { name: "Đơn hàng", value: "42", icon: TruckIcon, color: "bg-yellow-500" },
        { name: "Doanh thu", value: "32.5M VND", icon: ChartBarIcon, color: "bg-purple-500" }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow p-6 flex items-center space-x-4"
                    >
                        <div className={`${item.color} p-3 rounded-full`}>
                            <item.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{item.name}</p>
                            <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium">Thống kê hoạt động</h3>
                </div>
                <div className="p-6 h-64 flex items-center justify-center text-gray-500">
                    Biểu đồ thống kê sẽ được hiển thị ở đây
                </div>
            </div>

            <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium">Hoạt động gần đây</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="px-6 py-4">
                            <div className="flex justify-between">
                                <p>Hoạt động {item}</p>
                                <span className="text-sm text-gray-500">Hôm nay</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
