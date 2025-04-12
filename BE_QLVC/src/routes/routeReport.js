const express = require('express');
const router = express.Router();
const {
    getAllReports,
    createFinancialReport,
    createStaffReport,
    getFinancialReportById,
    getStaffReportById
} = require('../controllers/controllerReport');

// Get all reports
router.get('/reports', getAllReports);

// Create financial report
router.post('/reports/financial', createFinancialReport);

// Create staff performance report
router.post('/reports/staff', createStaffReport);

// Get financial report by ID
router.get('/reports/financial/:id', getFinancialReportById);

// Get staff report by ID
router.get('/reports/staff/:id', getStaffReportById);

module.exports = router;
