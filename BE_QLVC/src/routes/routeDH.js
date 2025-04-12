const express = require('express');
const router = express.Router();
const {
    getDonHang,
    getDonHangById,
    createDonHang,
    updateDonHang,
    updateDonHangStatus,
    deleteDonHang,
    getDonHangByStatus,
    getDonHangByCustomer,
    getDonHangByStaff,
    getDonHangByDateRange,
} = require('../controllers/controllerDH');

router.get('/donhang', getDonHang);
router.get('/donhang/:id', getDonHangById);
router.post('/donhang', createDonHang);
router.put('/donhang/:id', updateDonHang);
router.put('/donhang/:id/status', updateDonHangStatus);
router.delete('/donhang/:id', deleteDonHang);
router.get('/donhang/status/:status', getDonHangByStatus);
router.get('/donhang/customer/:idKH', getDonHangByCustomer);
router.get('/donhang/staff/:idNV', getDonHangByStaff);
router.get('/donhang/daterange', getDonHangByDateRange);

module.exports = router;