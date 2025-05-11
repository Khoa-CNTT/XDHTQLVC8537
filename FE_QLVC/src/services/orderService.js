import axios from 'axios';

// API base URL configuration - can be changed based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create a cache for responses to avoid redundant API calls
const responseCache = new Map();

// Function to get token from local storage
const getToken = () => {
    return localStorage.getItem('token');
};

// Order service methods for making API calls to order endpoints
export const orderService = {
  // Get all orders with optional filters
  getOrders: async (filters = {}) => {
    try {
      const { 
        status, 
        customerId,
        employeeId, 
        paymentStatus, 
        startDate, 
        endDate,
        cod 
      } = filters;
      
      let queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      if (customerId) queryParams.append('customerId', customerId);
      if (employeeId) queryParams.append('employeeId', employeeId);
      if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
      if (startDate) queryParams.append('startDate', startDate.toISOString());
      if (endDate) queryParams.append('endDate', endDate.toISOString());
      if (cod) queryParams.append('cod', cod);

      // Build cache key based on query parameters
      const cacheKey = `orders-${queryParams.toString()}`;
      
      if (responseCache.has(cacheKey)) {
        console.log("Returning cached orders data");
        return responseCache.get(cacheKey);
      }
      
      console.log("Fetching orders from:", `${API_BASE_URL}/orders?${queryParams.toString()}`);
      const response = await axios.get(`${API_BASE_URL}/orders?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000, // Tăng timeout lên 10 giây
      });
      
      // Kiểm tra cấu trúc response và log chi tiết để debug
      console.log("Server response:", response.data);
      
      if (response.data && response.data.data) {
        responseCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error("Error details:", error.response?.data || "No detailed error information");

      // More detailed error information
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }      // Handle specific HTTP status codes
      if (error.response) {
        if (error.response.status === 401) {
          // Clear token and userInfo from localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          
          // Dispatch an event that the app can listen for to redirect user
          window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Token expired' }));
          
          throw new Error('Phiên đăng nhập đã hết hạn, bạn sẽ được đưa về trang đăng nhập');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng');
      }

      throw error;
    }
  },
  // Get revenue statistics by period type and year
  getRevenueStats: async (periodType = 'month', year) => {
    try {
      let queryParams = new URLSearchParams();
      queryParams.append('periodType', periodType);
      if (year) queryParams.append('year', year);
      
      // Build cache key based on query parameters
      const cacheKey = `revenue-stats-${periodType}-${year || 'current'}`;
      
      // Only use cache for short period to ensure data freshness
      if (responseCache.has(cacheKey)) {
        const cachedData = responseCache.get(cacheKey);
        const cacheTime = cachedData.timestamp || 0;
        const now = Date.now();
        // Use cache if it's less than 5 minutes old
        if (now - cacheTime < 5 * 60 * 1000) {
          console.log("Returning cached revenue stats");
          return cachedData.data;
        }
      }
      
      console.log("Fetching revenue stats from:", `${API_BASE_URL}/reports/revenue-stats?${queryParams.toString()}`);
      const response = await axios.get(`${API_BASE_URL}/reports/revenue-stats?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000
      });
      
      if (response.data && response.data.success && response.data.data) {
        // Store data with timestamp for cache expiration
        responseCache.set(cacheKey, {
          data: response.data.data,
          timestamp: Date.now()
        });
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Token expired' }));
          throw new Error('Phiên đăng nhập đã hết hạn, bạn sẽ được đưa về trang đăng nhập');
        }
        throw new Error(error.response.data?.error || 'Có lỗi xảy ra khi tải dữ liệu thống kê');
      }
      throw error;
    }
  },

  // Get a specific order by ID
  getOrderById: async (id) => {
    const cacheKey = `order-${id}`;

    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        responseCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng');
      }

      throw error;
    }
  },

  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 15000, // Increased timeout for creating orders
      });

      // Clear cache for orders since a new one was added
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error || 'Failed to create order');
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Dữ liệu đơn hàng không hợp lệ');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      }

      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${id}/status`, { status }, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      // Clear caches that might contain this order
      responseCache.delete(`order-${id}`);
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to update order status');
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Trạng thái đơn hàng không hợp lệ');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
      }

      throw error;
    }
  },

  // Approve an order - move to next status
  approveOrder: async (id) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${id}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      // Clear caches that might contain this order
      responseCache.delete(`order-${id}`);
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to approve order');
    } catch (error) {
      console.error(`Error approving order ${id}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Không thể phê duyệt đơn hàng này');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi phê duyệt đơn hàng');
      }

      throw error;
    }
  },

  // Cancel an order
  cancelOrder: async (id, cancelReason = '') => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${id}/cancel`, { cancelReason }, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      // Clear caches that might contain this order
      responseCache.delete(`order-${id}`);
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to cancel order');
    } catch (error) {
      console.error(`Error cancelling order ${id}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Không thể hủy đơn hàng này');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
      }

      throw error;
    }
  },

  // Update COD status
  updateCODStatus: async (id, codData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${id}/cod`, codData, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      // Clear caches that might contain this order
      responseCache.delete(`order-${id}`);
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to update COD status');
    } catch (error) {
      console.error(`Error updating COD for order ${id}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Dữ liệu COD không hợp lệ');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin COD');
      }

      throw error;
    }
  },
  
  // Accept an order by a staff member
  acceptOrder: async (id, staffId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${id}/accept`, { staffId }, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });

      // Clear caches that might contain this order
      responseCache.delete(`order-${id}`);
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to accept order');
    } catch (error) {
      console.error(`Error accepting order ${id}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Không thể nhận đơn hàng này');
        } else if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi nhận đơn hàng');
      }

      throw error;
    }
  },
  
  // Get order statistics
  getOrderStatistics: async (dateRange = {}) => {
    try {
      const { startDate, endDate } = dateRange;
      
      let queryParams = new URLSearchParams();
      
      if (startDate) queryParams.append('startDate', startDate.toISOString());
      if (endDate) queryParams.append('endDate', endDate.toISOString());
      
      const cacheKey = `order-statistics-${queryParams.toString()}`;
      
      if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey);
      }
      
      const response = await axios.get(`${API_BASE_URL}/orders/statistics?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });
      
      if (response.data && response.data.data) {
        responseCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu thống kê');
      }

      throw error;
    }
  },

  // Get orders by customer ID
  getOrdersByCustomer: async (customerId) => {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }
      
      const cacheKey = `customer-orders-${customerId}`;
      
      if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey);
      }
      
      const response = await axios.get(`${API_BASE_URL}/orders?customerId=${customerId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });
      
      if (response.data && response.data.data) {
        responseCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error fetching orders for customer ${customerId}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng của khách hàng');
      }

      throw error;
    }
  },

  // Get orders by staff ID
  getOrdersByStaff: async (employeeId) => {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      
      const cacheKey = `staff-orders-${employeeId}`;
      
      if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey);
      }
      
      const response = await axios.get(`${API_BASE_URL}/orders?employeeId=${employeeId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });
      
      if (response.data && response.data.data) {
        responseCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error fetching orders for staff ${employeeId}:`, error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng của nhân viên');
      }

      throw error;
    }
  },

  // Get all pending orders waiting for staff acceptance
  getPendingOrders: async () => {
    try {
      // Build cache key
      const cacheKey = 'pending-orders';
      
      // Use cache if available but not for too long (30 seconds)
      if (responseCache.has(cacheKey)) {
        const cachedData = responseCache.get(cacheKey);
        const now = Date.now();
        if (now - cachedData.timestamp < 30 * 1000) { // 30 seconds
          console.log("Returning cached pending orders data");
          return cachedData.data;
        }
        // Otherwise fetch fresh data
      }
      
      // console.log("Fetching pending orders");
      const response = await axios.get(`${API_BASE_URL}/pending-orders`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        timeout: 10000,
      });
      
      if (response.data && response.data.data) {
        responseCache.set(cacheKey, {
          data: response.data.data,
          timestamp: Date.now()
        });
        return response.data.data;
      } else if (response.data) {
        responseCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi tải đơn hàng đang chờ');
      }

      throw error;
    }
  },

  // Accept a pending order as staff
  acceptPendingOrder: async (pendingOrderId, staffId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/pending-orders/${pendingOrderId}/accept`, 
        { staffId },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          },
          timeout: 10000,
        }
      );

      // Clear cache for both pending orders and staff orders since there are changes
      Array.from(responseCache.keys())
        .filter(key => key.startsWith('pending-orders') || key.startsWith('orders-'))
        .forEach(key => responseCache.delete(key));

      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || 'Failed to accept order');
    } catch (error) {
      console.error('Error accepting pending order:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã khởi động chưa.');
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || 'Có lỗi xảy ra khi nhận đơn hàng');
      }

      throw error;
    }
  },

  // Clear cache when needed (e.g., after logout)
  clearCache: () => {
    responseCache.clear();
  }
};

export default orderService;
