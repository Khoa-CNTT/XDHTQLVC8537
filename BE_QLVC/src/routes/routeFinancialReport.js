const express = require('express');
const router = express.Router();
const financialReportController = require('../controllers/controllerFinancialReport');

// Lấy thống kê doanh thu
router.get('/financial-reports/revenue-statistics', financialReportController.getRevenueStatistics);

// Lấy báo cáo tài chính theo khoảng thời gian
router.get('/financial-reports/date-range', financialReportController.getFinancialReportsByDateRange);

// Lấy tất cả báo cáo tài chính
router.get('/financial-reports', financialReportController.getAllFinancialReports);

// Lấy báo cáo tài chính theo ID
router.get('/financial-reports/:id', financialReportController.getFinancialReportById);

// Tạo báo cáo tài chính tự động
router.post('/financial-reports/generate-automatic', financialReportController.generateAutomaticFinancialReport);

// Tạo báo cáo tài chính mới
router.post('/financial-reports', financialReportController.createFinancialReport);

// Cập nhật báo cáo tài chính
router.put('/financial-reports/:id', financialReportController.updateFinancialReport);

// Xóa báo cáo tài chính
router.delete('/financial-reports/:id', financialReportController.deleteFinancialReport);

module.exports = router;
