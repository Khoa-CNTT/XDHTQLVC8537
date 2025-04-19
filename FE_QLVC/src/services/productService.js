<<<<<<< HEAD
import api from './api';

export const productService = {
    getProducts: async () => {
        try {
            const response = await api.get('/hanghoa');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await api.post('/hanghoa', productData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await api.put(`/hanghoa/${id}`, productData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await api.delete(`/hanghoa/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCategories: async () => {
        try {
            const response = await api.get('/loaihh');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getProperties: async () => {
        try {
            const response = await api.get('/tinhchathh');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
=======
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const productService = {
    // Get all products
    getProducts: async () => {
        try {
            const response = await axios.get(`${API_URL}/hanghoa`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    // Get product by ID
    getProductById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/hanghoa/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error.response?.data?.error || 'Failed to fetch product details';
        }
    },

    // Get products by category
    getProductsByCategory: async (categoryId) => {
        try {
            const response = await axios.get(`${API_URL}/hanghoa/loai/${categoryId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by category:', error);
            return [];
        }
    },

    // Get product categories
    getCategories: async () => {
        try {
            const response = await axios.get(`${API_URL}/loaihh`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching product categories:', error);
            return [];
>>>>>>> thong
        }
    }
};