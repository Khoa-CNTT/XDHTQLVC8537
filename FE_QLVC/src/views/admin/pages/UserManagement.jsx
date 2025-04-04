import React, { useState, useEffect } from 'react';
import { UserTable } from '../components/UserTable';
import { UserForm } from '../components/UserForm';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { authService } from '../../../services/authService';
import toast, { Toaster } from 'react-hot-toast';

export const UserManagement = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await authService.getUsers();
            setUsers(data);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách tài khoản');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (values, { resetForm }) => {
        try {
            if (selectedUser) {
                await authService.updateUser(selectedUser.ID_TK, values);
                toast.success('Cập nhật tài khoản thành công');
            } else {
                await authService.createUser(values);
                toast.success('Thêm tài khoản thành công');
            }
            fetchUsers();
            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async () => {
        try {
            await authService.deleteUser(selectedUser.ID_TK);
            toast.success('Xóa tài khoản thành công');
            fetchUsers();
            setIsDeleteConfirmOpen(false);
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold text-gray-900">Quản lý tài khoản</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        Danh sách tất cả tài khoản người dùng trong hệ thống
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedUser(null);
                            setIsFormOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Thêm tài khoản
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <UserTable
                    users={users}
                    onEdit={(user) => {
                        setSelectedUser(user);
                        setIsFormOpen(true);
                    }}
                    onDelete={(user) => {
                        setSelectedUser(user);
                        setIsDeleteConfirmOpen(true);
                    }}
                />
            )}

            <UserForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedUser(null);
                }}
                onSubmit={handleSubmit}
                initialValues={selectedUser}
            />

            <DeleteConfirm
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Xóa tài khoản"
                message={`Bạn có chắc chắn muốn xóa tài khoản ${selectedUser?.Email}?`}
            />
            <Toaster position="top-right" />
        </div>
    );
};