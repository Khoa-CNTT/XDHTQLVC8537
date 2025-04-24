import api from './api.js';
export const notificationService = {
  async getStaffNotifications(staffId) {
    // Lấy tất cả thông báo liên quan đến nhân viên (theo đơn hàng của nhân viên)
    const res = await api.get(`/notifications/staff/${staffId}`);
    return res.data?.data || [];
  },
  async markAllAsRead(staffId) {
    // Gọi API backend để đánh dấu tất cả thông báo là đã đọc
    return api.put(`/notifications/staff/${staffId}/read-all`);
  }
};
