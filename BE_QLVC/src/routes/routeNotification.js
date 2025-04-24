const express = require('express');
const router = express.Router();
const { getNotificationsByOrder, getNotificationsByStaff, createNotification, deleteNotification, markAllNotificationsAsRead } = require('../controllers/controllerNotification');

// Get notifications for a specific order
router.get('/notifications/order/:idDH', getNotificationsByOrder);
// Get notifications for all orders of a staff
router.get('/notifications/staff/:staffId', getNotificationsByStaff);

// Create a new notification
router.post('/notifications', createNotification);

// Delete notification
router.delete('/notifications/:id', deleteNotification);

// Đánh dấu tất cả thông báo của nhân viên là đã đọc
router.put('/notifications/staff/:staffId/read-all', markAllNotificationsAsRead);

module.exports = router;
