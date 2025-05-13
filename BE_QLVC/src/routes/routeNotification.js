const express = require('express');
const router = express.Router();
const { 
    getNotificationsByOrder, 
    getNotificationsByStaff, 
    createNotification, 
    deleteNotification, 
    markAllNotificationsAsRead,
    getNotificationsByUser,
    markUserNotificationsAsRead,
    getAllNotifications,
    markNotificationAsRead,
    getNotificationsByStaffSince,
    getNotificationsByUserSince
} = require('../controllers/controllerNotification');

// Get notifications for a specific order
router.get('/notifications/order/:idDH', getNotificationsByOrder);
// Get notifications for all orders of a staff
router.get('/notifications/staff/:staffId', getNotificationsByStaff);
// Get notifications for all orders of a user
router.get('/notifications/user/:userId', getNotificationsByUser);

// Get notifications for a staff since a specific timestamp
router.get('/notifications/staff/:staffId/since/:timestamp', getNotificationsByStaffSince);
// Get notifications for a user since a specific timestamp
router.get('/notifications/user/:userId/since/:timestamp', getNotificationsByUserSince);

// Create a new notification
router.post('/notifications', createNotification);

// Delete notification
router.delete('/notifications/:id', deleteNotification);

// Đánh dấu tất cả thông báo của nhân viên là đã đọc
router.put('/notifications/staff/:staffId/read-all', markAllNotificationsAsRead);
// Đánh dấu tất cả thông báo của người dùng là đã đọc
router.put('/notifications/user/:userId/read-all', markUserNotificationsAsRead);

// Get all notifications (for admin)
router.get('/notifications', getAllNotifications);

// Mark a single notification as read
router.put('/notifications/:id/read', markNotificationAsRead);

module.exports = router;
