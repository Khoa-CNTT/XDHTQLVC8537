import { Dialog } from '@headlessui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const userSchema = Yup.object().shape({
    Email: Yup.string()
        .email('Email không hợp lệ')
        .required('Email là bắt buộc'),
    Matkhau: Yup.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .required('Mật khẩu là bắt buộc'),
    SDT: Yup.string()
        .matches(/^[0-9]+$/, 'Số điện thoại không hợp lệ')
        .min(10, 'Số điện thoại phải có ít nhất 10 số')
        .required('Số điện thoại là bắt buộc'),
    Role: Yup.string().required('Vai trò là bắt buộc'),
});

export const UserForm = ({ isOpen, onClose, onSubmit, initialValues }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white shadow-xl">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                            {initialValues ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
                        </Dialog.Title>
                    </div>
                    <Formik
                        initialValues={initialValues || {
                            Email: '',
                            Matkhau: '',
                            SDT: '',
                            Role: 'user',
                        }}
                        validationSchema={userSchema}
                        onSubmit={onSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <Field
                                            name="Email"
                                            type="email"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="example@email.com"
                                        />
                                        {errors.Email && touched.Email && (
                                            <div className="mt-1 text-sm text-red-600">{errors.Email}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mật khẩu
                                        </label>
                                        <Field
                                            name="Matkhau"
                                            type="password"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                        {errors.Matkhau && touched.Matkhau && (
                                            <div className="mt-1 text-sm text-red-600">{errors.Matkhau}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số điện thoại
                                        </label>
                                        <Field
                                            name="SDT"
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="0123456789"
                                        />
                                        {errors.SDT && touched.SDT && (
                                            <div className="mt-1 text-sm text-red-600">{errors.SDT}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vai trò
                                        </label>
                                        <Field
                                            as="select"
                                            name="Role"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </Field>
                                        {errors.Role && touched.Role && (
                                            <div className="mt-1 text-sm text-red-600">{errors.Role}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        {initialValues ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};