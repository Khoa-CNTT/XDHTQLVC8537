import React, { useState } from 'react';
import { UserManagement } from './pages/UserManagement';
import { ProductManagement } from './pages/ProductManagement';

export const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState('users'); // Default tab is 'users'

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Tabs for switching between User Management and Product Management */}
                    <div className="mb-6">
                        <nav className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'users'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Quản lý tài khoản
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'products'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Quản lý hàng hóa
                            </button>
                        </nav>
                    </div>

                    {/* Render the active tab */}
                    <div>
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'products' && <ProductManagement />}
                    </div>
                </div>
            </main>
        </div>
    );
};