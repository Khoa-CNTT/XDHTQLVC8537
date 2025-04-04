import { Dialog } from '@headlessui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const productSchema = Yup.object().shape({
    TenHH: Yup.string()
        .required('Tên hàng hóa là bắt buộc')
        .min(2, 'Tên hàng hóa phải có ít nhất 2 ký tự'),
    ID_LHH: Yup.number()
        .required('Loại hàng hóa là bắt buộc'),
    ID_TCHH: Yup.number()
        .required('Tính chất hàng hóa là bắt buộc'),
    SoLuong: Yup.number()
        .required('Số lượng là bắt buộc')
        .min(0, 'Số lượng không thể âm'),
    TrongLuong: Yup.number()
        .required('Trọng lượng là bắt buộc')
        .min(0, 'Trọng lượng không thể âm'),
    DonGia: Yup.number()
        .required('Đơn giá là bắt buộc')
        .min(0, 'Đơn giá không thể âm'),
    image: Yup.string()
        .required('Hình ảnh là bắt buộc')
});

export const ProductForm = ({ isOpen, onClose, onSubmit, initialValues, categories, properties }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white shadow-xl">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                            {initialValues ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
                        </Dialog.Title>
                    </div>
                    <Formik
                        initialValues={initialValues || {
                            TenHH: '',
                            ID_LHH: '',
                            ID_TCHH: '',
                            SoLuong: '',
                            TrongLuong: '',
                            DonGia: '',
                            image: ''
                        }}
                        validationSchema={productSchema}
                        onSubmit={onSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="p-6">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên hàng hóa
                                        </label>
                                        <Field
                                            name="TenHH"
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.TenHH && touched.TenHH && (
                                            <div className="mt-1 text-sm text-red-600">{errors.TenHH}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại hàng hóa
                                        </label>
                                        <Field
                                            as="select"
                                            name="ID_LHH"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="">Chọn loại hàng hóa</option>
                                            {categories?.map(category => (
                                                <option key={category.ID_LHH} value={category.ID_LHH}>
                                                    {category.TenLoaiHH}
                                                </option>
                                            ))}
                                        </Field>
                                        {errors.ID_LHH && touched.ID_LHH && (
                                            <div className="mt-1 text-sm text-red-600">{errors.ID_LHH}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tính chất
                                        </label>
                                        <Field
                                            as="select"
                                            name="ID_TCHH"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="">Chọn tính chất</option>
                                            {properties?.map(property => (
                                                <option key={property.ID_TCHH} value={property.ID_TCHH}>
                                                    {property.TenTCHH}
                                                </option>
                                            ))}
                                        </Field>
                                        {errors.ID_TCHH && touched.ID_TCHH && (
                                            <div className="mt-1 text-sm text-red-600">{errors.ID_TCHH}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số lượng
                                        </label>
                                        <Field
                                            name="SoLuong"
                                            type="number"
                                            min="0"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.SoLuong && touched.SoLuong && (
                                            <div className="mt-1 text-sm text-red-600">{errors.SoLuong}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trọng lượng (kg)
                                        </label>
                                        <Field
                                            name="TrongLuong"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.TrongLuong && touched.TrongLuong && (
                                            <div className="mt-1 text-sm text-red-600">{errors.TrongLuong}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Đơn giá (VNĐ)
                                        </label>
                                        <Field
                                            name="DonGia"
                                            type="number"
                                            min="0"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.DonGia && touched.DonGia && (
                                            <div className="mt-1 text-sm text-red-600">{errors.DonGia}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hình ảnh URL
                                        </label>
                                        <Field
                                            name="image"
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.image && touched.image && (
                                            <div className="mt-1 text-sm text-red-600">{errors.image}</div>
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