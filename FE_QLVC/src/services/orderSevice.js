import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const orderService = {
    // Get all orders
    getAllOrders: async () => {
        try {
            const response = await axios.get(`${API_URL}/donhang`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error.response?.data?.error || 'Failed to fetch orders';
        }
    },

    // Get order by ID
    getOrderById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/donhang/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error('Order not found');
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw error.response?.data?.error || 'Failed to fetch order details';
        }
    },

    // Create new order
    createOrder: async (orderData) => {
        try {
            const response = await axios.post(`${API_URL}/donhang`, orderData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Failed to create order');
        } catch (error) {
            console.error('Error creating order:', error);
            throw error.response?.data?.error || 'Failed to create order';
        }
    },

    // Update order status
    updateOrderStatus: async (orderId, status) => {
        try {
            const response = await axios.put(`${API_URL}/donhang/${orderId}/status`,
                { TrangThaiDonHang: status },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.success) {
                return true;
            }
            throw new Error(response.data?.message || 'Failed to update order status');
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error.response?.data?.error || 'Failed to update order status';
        }
    },

    // Get orders by customer
    getOrdersByCustomer: async (customerId) => {
        try {
            const response = await axios.get(`${API_URL}/donhang/customer/${customerId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching customer orders:', error);
            return [];
        }
    },

    // Get orders by staff
    getOrdersByStaff: async (staffId) => {
        try {
            const response = await axios.get(`${API_URL}/donhang/staff/${staffId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching staff orders:', error);
            return [];
        }
    },

    // Get orders by status
    getOrdersByStatus: async (status) => {
        try {
            const response = await axios.get(`${API_URL}/donhang/status/${status}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching orders by status:', error);
            return [];
        }
    }
};