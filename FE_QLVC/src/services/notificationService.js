import api from './api.js';
export const notificationService = {
  async getStaffNotifications(staffId) {
    // Lấy tất cả thông báo liên quan đến nhân viên (theo đơn hàng của nhân viên)
    try {
      const res = await api.get(`/notifications/staff/${staffId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error fetching staff notifications:", error);
      return [];
    }
  },
  async markAllAsRead(staffId) {
    // Gọi API backend để đánh dấu tất cả thông báo là đã đọc
    try {
      return await api.put(`/notifications/staff/${staffId}/read-all`);
    } catch (error) {
      console.error("Error marking staff notifications as read:", error);
      throw error;
    }
  },
  async markAsRead(notificationId) {
    // Đánh dấu một thông báo cụ thể là đã đọc
    try {
      return await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },
  async getUserNotifications(userId) {
    // Lấy tất cả thông báo liên quan đến người dùng (theo đơn hàng của người dùng)
    try {
      const res = await api.get(`/notifications/user/${userId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  },  async markUserNotificationsAsRead(userId) {
    // Đánh dấu tất cả thông báo của người dùng là đã đọc
    try {
      return await api.put(`/notifications/user/${userId}/read-all`);
    } catch (error) {
      console.error("Error marking user notifications as read:", error);
      throw error;
    }
  },
  
  async getNotifications() {
    // Lấy tất cả thông báo trong hệ thống (dành cho admin)
    try {
      const res = await api.get('/notifications');
      return res.data?.data || [];
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      return [];
    }
  }
};
