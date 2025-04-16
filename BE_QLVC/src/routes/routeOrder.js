const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  approveOrder,
  cancelOrder,
  updateCODStatus,
  getOrderStatistics,
  acceptOrder
} = require('../controllers/controllerOrder');

// Public routes (if any)

// Protected routes (require authentication)
router.get('/orders', authMiddleware, getOrders);
router.get('/orders/statistics', authMiddleware, getOrderStatistics);
router.get('/orders/:id', authMiddleware, getOrderById);
router.post('/orders', authMiddleware, createOrder);
router.put('/orders/:id/status', authMiddleware, updateOrderStatus);
router.put('/orders/:id/approve', authMiddleware, approveOrder);
router.put('/orders/:id/cancel', authMiddleware, cancelOrder);
router.put('/orders/:id/cod', authMiddleware, updateCODStatus);
router.put('/orders/:id/accept', authMiddleware, acceptOrder);

module.exports = router;
