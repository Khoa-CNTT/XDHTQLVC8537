import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export const UserTable = ({ users, onEdit, onDelete }) => {
    if (!users || users.length === 0) {
        return <div className="text-center py-4">Không có dữ liệu người dùng</div>;
    }

    return (
        <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.ID_TK} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.ID_TK}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.Email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.HoTen}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.Role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.Role === 'staff' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {user.Role === 'admin' ? 'Admin' : user.Role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.SDT}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.DiaChi}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        title="Chỉnh sửa"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Xóa"
                                    >
                                        <TrashIcon className="h-5 w-5" />
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