import React, { useState, useEffect } from "react";
import { UserTable } from "../user/UserTable";
import { DeleteConfirm } from "../../components/layout/DeleteConfirm";
import { authService } from "../../services/authService";
import toast, { Toaster } from "react-hot-toast";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const userSchema = Yup.object().shape({
  Email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
  Matkhau: Yup.string().required("Mật khẩu là bắt buộc"),
  SDT: Yup.string().required("Số điện thoại là bắt buộc"),
  Role: Yup.string().required("Vai trò là bắt buộc"),
});

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
      toast.error(error.message || "Không thể tải danh sách tài khoản");
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
        toast.success("Cập nhật tài khoản thành công");
      } else {
        await authService.createUser(values);
        toast.success("Thêm tài khoản thành công");
      }
      fetchUsers();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    try {
      await authService.deleteUser(selectedUser.ID_TK);
      toast.success("Xóa tài khoản thành công");
      fetchUsers();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(!isFormOpen);
            }}
            className="admin-add-button"
          >
            {isFormOpen ? "Đóng form" : "Thêm tài khoản"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
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

          {isFormOpen && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedUser ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
              </h3>
              <Formik
                initialValues={selectedUser || {
                  Email: "",
                  Matkhau: "",
                  SDT: "",
                  Role: "user",
                }}
                validationSchema={userSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched }) => (
                  <Form>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mật khẩu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số điện thoại
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vai trò
                          </th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Field
                              name="Email"
                              type="email"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.Email && touched.Email && (
                              <div className="mt-1 text-sm text-red-600">{errors.Email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Field
                              name="Matkhau"
                              type="password"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.Matkhau && touched.Matkhau && (
                              <div className="mt-1 text-sm text-red-600">{errors.Matkhau}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Field
                              name="SDT"
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.SDT && touched.SDT && (
                              <div className="mt-1 text-sm text-red-600">{errors.SDT}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Field
                              as="select"
                              name="Role"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="user">Người dùng</option>
                              <option value="admin">Admin</option>
                              <option value="staff">Nhân viên</option>
                            </Field>
                            {errors.Role && touched.Role && (
                              <div className="mt-1 text-sm text-red-600">{errors.Role}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-3">
                              <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                              >
                                {selectedUser ? "Cập nhật" : "Thêm mới"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </>
      )}

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