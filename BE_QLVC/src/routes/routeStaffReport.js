const express = require('express');
const router = express.Router();
const staffReportController = require('../controllers/controllerStaffReport');

// Lấy báo cáo nhân viên theo khoảng thời gian
router.get('/staff-reports/date-range', staffReportController.getStaffReportsByDateRange);

// Lấy báo cáo nhân viên theo nhân viên cụ thể
router.get('/staff-reports/staff/:staffId', staffReportController.getStaffReportsByStaffId);

// Lấy tất cả báo cáo nhân viên
router.get('/staff-reports', staffReportController.getAllStaffReports);

// Lấy báo cáo nhân viên theo ID
router.get('/staff-reports/:id', staffReportController.getStaffReportById);

// Tạo báo cáo nhân viên tự động
router.post('/staff-reports/generate-automatic', staffReportController.generateAutomaticStaffReport);

// Tạo báo cáo nhân viên mới
router.post('/staff-reports', staffReportController.createStaffReport);

// Cập nhật báo cáo nhân viên
router.put('/staff-reports/:id', staffReportController.updateStaffReport);

// Xóa báo cáo nhân viên
router.delete('/staff-reports/:id', staffReportController.deleteStaffReport);

module.exports = router;
