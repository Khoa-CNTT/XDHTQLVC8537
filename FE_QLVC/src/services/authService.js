import axios from 'axios';

// API base URL configuration - can be changed based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create a cache for responses to avoid redundant API calls
const responseCache = new Map();

// Function to get token from local storage
const getToken = () => {
    return localStorage.getItem('token');
};

// Improved getUsers function with better error handling
const getUsers = async () => {
    try {
        console.log("Fetching users from:", `${API_BASE_URL}/users`);
        const response = await axios.get(`${API_BASE_URL}/users`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            timeout: 10000, // Tăng timeout lên 10 giây
        });
        
        // Kiểm tra cấu trúc response và log chi tiết để debug
        console.log("Server response:", response.data);
        
        if (response.data && response.data.data) {
            return response.data.data;
        } else if (response.data) {
            return response.data;
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error("Error fetching users:", error);
        console.error("Error details:", error.response?.data || "No detailed error information");

        // More detailed error information
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
        }

        // Handle specific HTTP status codes
        if (error.response) {
            if (error.response.status === 401) {
                throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
            }
            throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
        }

        throw error;
    }
};

export const authService = {
    // Get customer info by account ID
    getKhachHangByTK: async (idTK) => {
        const cacheKey = `kh-${idTK}`;

        if (responseCache.has(cacheKey)) {
            return responseCache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/users/khachhang/tk/${idTK}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                responseCache.set(cacheKey, response.data.data);
                return response.data.data;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch customer data');
            }
        } catch (error) {
            console.error('Error fetching customer info:', error);
            throw error.response?.data?.error || 'Failed to fetch customer info';
        }
    },

    // Get staff info by account ID
    getNhanVienByTK: async (idTK) => {
        const cacheKey = `nv-${idTK}`;

        if (responseCache.has(cacheKey)) {
            return responseCache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/users/nhanvien/tk/${idTK}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success && response.data.data) {
                responseCache.set(cacheKey, response.data.data);
                return response.data.data;
            } else {
                console.error("Invalid staff data format:", response.data);
                throw new Error('Invalid staff data format');
            }
        } catch (error) {
            console.error('Error fetching staff info:', error);
            throw error.response?.data?.error || 'Failed to fetch staff info';
        }
    },

    // Get all staff
    getNhanVien: async () => {
        const cacheKey = 'all-staff';

        if (responseCache.has(cacheKey)) {
            return responseCache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/nhanvien`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                const data = response.data.data || [];
                responseCache.set(cacheKey, data);
                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching staff list:', error);
            return [];
        }
    },

    getUsers,

    // Create new user
    createUser: async (userData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/register`, userData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data?.error || 'Failed to create user');
        } catch (error) {
            console.error('Error creating user:', error);
            throw error.response?.data?.error || 'Failed to create user';
        }
    },

    // Update user
    updateUser: async (id, userData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data?.error || 'Failed to update user');
        } catch (error) {
            console.error('Error updating user:', error);
            throw error.response?.data?.error || 'Failed to update user';
        }
    },

    // Delete user
    deleteUser: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data?.error || 'Failed to delete user');
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error.response?.data?.error || 'Failed to delete user';
        }
    },

    // Clear cache on logout
    clearCache: () => {
        responseCache.clear();
    }
};