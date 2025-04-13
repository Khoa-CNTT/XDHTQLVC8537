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
        <Dialog open={isOpen} onClose={onClose} className="user-form-dialog">
            <div className="user-form-overlay" aria-hidden="true" />
            <div className="user-form-container">
                <Dialog.Panel className="user-form-panel">
                    <div className="user-form-header">
                        <Dialog.Title className="user-form-title">
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
                            <Form className="user-form-body">
                                <div className="user-form-space">
                                    <div>
                                        <label className="user-form-label">
                                            Email
                                        </label>
                                        <Field
                                            name="Email"
                                            type="email"
                                            className="user-form-input"
                                            placeholder="example@email.com"
                                        />
                                        {errors.Email && touched.Email && (
                                            <div className="user-form-error">{errors.Email}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="user-form-label">
                                            Mật khẩu
                                        </label>
                                        <Field
                                            name="Matkhau"
                                            type="password"
                                            className="user-form-input"
                                            placeholder="••••••••"
                                        />
                                        {errors.Matkhau && touched.Matkhau && (
                                            <div className="user-form-error">{errors.Matkhau}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="user-form-label">
                                            Số điện thoại
                                        </label>
                                        <Field
                                            name="SDT"
                                            type="text"
                                            className="user-form-input"
                                            placeholder="0123456789"
                                        />
                                        {errors.SDT && touched.SDT && (
                                            <div className="user-form-error">{errors.SDT}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="user-form-label">
                                            Vai trò
                                        </label>
                                        <Field
                                            as="select"
                                            name="Role"
                                            className="user-form-select"
                                        >
                                            <option value="user">Người dùng</option>
                                            <option value="staff">Nhân viên</option>
                                            <option value="admin">Admin</option>
                                        </Field>
                                        {errors.Role && touched.Role && (
                                            <div className="user-form-error">{errors.Role}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="user-form-actions">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="user-form-button-secondary"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="user-form-button-primary"
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