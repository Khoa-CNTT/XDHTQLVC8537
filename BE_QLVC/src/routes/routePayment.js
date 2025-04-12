const express = require('express');
const router = express.Router();
const {
    getAllPayments,
    createPayment,
    getPaymentById,
    updatePayment,
    deletePayment
} = require('../controllers/controllerPayment');

// Get all payments
router.get('/payments', getAllPayments);

// Create a new payment
router.post('/payments', createPayment);

// Get payment by ID
router.get('/payments/:id', getPaymentById);

// Update payment
router.put('/payments/:id', updatePayment);

// Delete payment
router.delete('/payments/:id', deletePayment);

module.exports = router;
