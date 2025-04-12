import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const productSchema = Yup.object().shape({
    TenHH: Yup.string()
        .required('Tên hàng hóa là bắt buộc')
        .min(2, 'Tên hàng hóa phải có ít nhất 2 ký tự'),
    ID_LHH: Yup.number().required('Loại hàng hóa là bắt buộc'),
    ID_TCHH: Yup.number().required('Tính chất hàng hóa là bắt buộc'),
    SoLuong: Yup.number()
        .required('Số lượng là bắt buộc')
        .min(0, 'Số lượng không thể âm'),
    TrongLuong: Yup.number()
        .required('Trọng lượng là bắt buộc')
        .min(0, 'Trọng lượng không thể âm'),
    DonGia: Yup.number()
        .required('Đơn giá là bắt buộc')
        .min(0, 'Đơn giá không thể âm'),
    image: Yup.string().required('Hình ảnh là bắt buộc'),
});

export const ProductForm = ({ onSubmit, initialValues, categories, properties, onClose }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                {initialValues ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
            </h3>
            <Formik
                initialValues={
                    initialValues || {
                        TenHH: '',
                        ID_LHH: '',
                        ID_TCHH: '',
                        SoLuong: '',
                        TrongLuong: '',
                        DonGia: '',
                        image: '',
                    }
                }
                validationSchema={productSchema}
                onSubmit={onSubmit}
            >
                {({ errors, touched }) => (
                    <Form className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên hàng hóa</label>
                            <Field
                                name="TenHH"
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.TenHH && touched.TenHH && (
                                <div className="mt-1 text-sm text-red-600">{errors.TenHH}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loại hàng hóa</label>
                            <Field
                                as="select"
                                name="ID_LHH"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Chọn loại hàng hóa</option>
                                {categories?.map((category) => (
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
                            <label className="block text-sm font-medium text-gray-700">Tính chất</label>
                            <Field
                                as="select"
                                name="ID_TCHH"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Chọn tính chất</option>
                                {properties?.map((property) => (
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
                            <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                            <Field
                                name="SoLuong"
                                type="number"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.SoLuong && touched.SoLuong && (
                                <div className="mt-1 text-sm text-red-600">{errors.SoLuong}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Trọng lượng (kg)</label>
                            <Field
                                name="TrongLuong"
                                type="number"
                                step="0.1"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.TrongLuong && touched.TrongLuong && (
                                <div className="mt-1 text-sm text-red-600">{errors.TrongLuong}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Đơn giá (VNĐ)</label>
                            <Field
                                name="DonGia"
                                type="number"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.DonGia && touched.DonGia && (
                                <div className="mt-1 text-sm text-red-600">{errors.DonGia}</div>
                            )}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Hình ảnh URL</label>
                            <Field
                                name="image"
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {errors.image && touched.image && (
                                <div className="mt-1 text-sm text-red-600">{errors.image}</div>
                            )}
                        </div>

                        <div className="col-span-2 flex justify-end space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                {initialValues ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};