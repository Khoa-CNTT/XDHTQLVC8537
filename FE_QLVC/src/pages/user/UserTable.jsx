import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export const UserTable = ({ users, onEdit, onDelete }) => {
    if (!users || users.length === 0) {
        return <div className="text-center py-4">Không có dữ liệu người dùng</div>;
    }

    return (
        <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm"> {/* Added shadow-sm */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        {/* Updated header background and text */}
                        <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Họ tên</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Số điện thoại</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Địa chỉ</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.ID_TK} className="hover:bg-gray-50">
                                {/* Adjusted cell padding */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{user.ID_TK}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.Email}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.HoTen}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {/* Role badge styles seem okay, keeping them */}
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.Role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.Role === 'staff' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {user.Role === 'admin' ? 'Admin' : user.Role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.SDT}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.DiaChi}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    {/* Updated action button colors */}
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-blue-600 hover:text-blue-800 mr-3 p-1 rounded hover:bg-blue-100" // Adjusted spacing and added hover bg
                                        title="Chỉnh sửa"
                                    >
                                        <PencilIcon className="h-4 w-4" /> {/* Slightly smaller icon */}
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100" // Added hover bg
                                        title="Xóa"
                                    >
                                        <TrashIcon className="h-4 w-4" /> {/* Slightly smaller icon */}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};