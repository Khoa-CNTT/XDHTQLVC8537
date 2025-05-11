import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
        }
    }
};