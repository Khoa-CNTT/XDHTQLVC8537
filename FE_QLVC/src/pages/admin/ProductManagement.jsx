import React, { useState, useEffect } from "react";
import { ProductTable } from "./ProductTable";
import { ProductForm } from "./ProductForm";
import { DeleteConfirm } from "../../components/layout/DeleteConfirm";
import { productService } from "../../services/productService";
import toast, { Toaster } from "react-hot-toast";

export const ProductManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsData, categoriesData, propertiesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
        productService.getProperties(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu hàng hóa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.ID_HH, values);
        toast.success("Cập nhật hàng hóa thành công");
      } else {
        await productService.createProduct(values);
        toast.success("Thêm hàng hóa thành công");
      }
      fetchData();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(selectedProduct.ID_HH);
      toast.success("Xóa hàng hóa thành công");
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý hàng hóa
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Danh sách tất cả hàng hóa trong hệ thống
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Thêm hàng hóa
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={(product) => {
            setSelectedProduct(product);
            setIsFormOpen(true);
          }}
          onDelete={(product) => {
            setSelectedProduct(product);
            setIsDeleteConfirmOpen(true);
          }}
        />
      )}

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleSubmit}
        initialValues={selectedProduct}
        categories={categories}
        properties={properties}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Xóa hàng hóa"
        message={`Bạn có chắc chắn muốn xóa hàng hóa ${selectedProduct?.TenHH}?`}
      />
      <Toaster position="top-right" />
    </div>
  );
};
