const express = require('express');
const router = express.Router();
const {
    getAllReports,
    createFinancialReport,
    createStaffReport,
    getFinancialReportById,
    getStaffReportById,
    getRevenueByPeriod,
    getRevenueStats
} = require('../controllers/controllerReport');

// Get all reports
router.get('/reports', getAllReports);

// Get revenue data by period (for dashboard)
router.get('/reports/revenue', getRevenueByPeriod);

// Get detailed revenue statistics by month/year
router.get('/reports/revenue-stats', getRevenueStats);

// Create financial report
router.post('/reports/financial', createFinancialReport);

// Create staff performance report
router.post('/reports/staff', createStaffReport);

// Get financial report by ID
router.get('/reports/financial/:id', getFinancialReportById);

// Get staff report by ID
router.get('/reports/staff/:id', getStaffReportById);

module.exports = router;
