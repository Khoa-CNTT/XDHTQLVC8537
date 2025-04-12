import React, { useState, useEffect } from "react";
import { UserTable } from "../user/UserTable";
import { DeleteConfirm } from "../../components/layout/DeleteConfirm";
import { authService } from "../../services/authService";
import toast, { Toaster } from "react-hot-toast";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  Email: Yup.string()
    .email("Email không hợp lệ")
    .required("Email là bắt buộc"),
  MatKhau: Yup.string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu là bắt buộc"),
  HoTen: Yup.string()
    .required("Họ tên là bắt buộc"),
  DiaChi: Yup.string()
    .required("Địa chỉ là bắt buộc"),
  SDT: Yup.string()
    .matches(/^[0-9]+$/, "Số điện thoại chỉ được chứa số")
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .max(11, "Số điện thoại không được quá 11 số")
    .required("Số điện thoại là bắt buộc"),
  Role: Yup.string()
    .oneOf(["admin", "staff", "user"], "Vai trò không hợp lệ")
    .required("Vai trò là bắt buộc"),
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

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const userData = {
        Email: values.Email,
        MatKhau: values.MatKhau,
        HoTen: values.HoTen,
        DiaChi: values.DiaChi,
        SDT: values.SDT,
        Role: values.Role,
      };

      if (selectedUser) {
        // Update existing user
        await authService.updateUser(selectedUser.ID_TK, userData);
        toast.success("Cập nhật tài khoản thành công");
      } else {
        // Create new user
        await authService.createUser(userData);
        toast.success("Thêm tài khoản thành công");
      }

      await fetchUsers(); // Refresh danh sách người dùng
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
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
              setSelectedUser({
                ...user,
                MatKhau: "",
              });
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
                initialValues={{
                  Email: selectedUser?.Email || "",
                  MatKhau: "",
                  HoTen: selectedUser?.HoTen || "",
                  DiaChi: selectedUser?.DiaChi || "",
                  SDT: selectedUser?.SDT || "",
                  Role: selectedUser?.Role || "user",
                }}
                enableReinitialize={true}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <Field
                          name="Email"
                          type="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.Email && touched.Email && (
                          <div className="mt-1 text-sm text-red-600">{errors.Email}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mật khẩu
                        </label>
                        <Field
                          name="MatKhau"
                          type="password"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.MatKhau && touched.MatKhau && (
                          <div className="mt-1 text-sm text-red-600">{errors.MatKhau}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Số điện thoại
                        </label>
                        <Field
                          name="SDT"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.SDT && touched.SDT && (
                          <div className="mt-1 text-sm text-red-600">{errors.SDT}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Vai trò
                        </label>
                        <Field
                          as="select"
                          name="Role"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="user">Người dùng</option>
                          <option value="admin">Admin</option>
                          <option value="staff">Nhân viên</option>
                        </Field>
                        {errors.Role && touched.Role && (
                          <div className="mt-1 text-sm text-red-600">{errors.Role}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Họ tên
                        </label>
                        <Field
                          name="HoTen"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.HoTen && touched.HoTen && (
                          <div className="mt-1 text-sm text-red-600">{errors.HoTen}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Địa chỉ
                        </label>
                        <Field
                          name="DiaChi"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.DiaChi && touched.DiaChi && (
                          <div className="mt-1 text-sm text-red-600">{errors.DiaChi}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFormOpen(false);
                          setSelectedUser(null);
                        }}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {selectedUser ? "Cập nhật" : "Thêm mới"}
                      </button>
                    </div>
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