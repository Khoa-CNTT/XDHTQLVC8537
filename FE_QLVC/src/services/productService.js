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
        }
    }
};