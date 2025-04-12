const express = require('express');
const router = express.Router();
const {
    getNotificationsByOrder,
    createNotification,
    deleteNotification
} = require('../controllers/controllerNotification');

// Get notifications for a specific order
router.get('/notifications/order/:idDH', getNotificationsByOrder);

// Create a new notification
router.post('/notifications', createNotification);

// Delete notification
router.delete('/notifications/:id', deleteNotification);

module.exports = router;
