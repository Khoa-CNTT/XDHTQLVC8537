const express = require('express');
const router = express.Router();
const {
    getUser,
    registerUser,
    getUserById,
    getKhachHangByTK,
    getNhanVienByTK,
    getAllNhanVien,
    updateUser,
    deleteUser,
    loginUser,
    getDashboardStats,
} = require('../controllers/controllerUser');

router.get('/users', getUser);
router.post('/register', registerUser);
router.get('/users/:id', getUserById);
router.get('/users/khachhang/tk/:idTK', getKhachHangByTK);
router.get('/users/nhanvien/tk/:idTK', getNhanVienByTK);
router.get('/nhanvien', getAllNhanVien);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/login', loginUser);

// Dashboard statistics route
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;