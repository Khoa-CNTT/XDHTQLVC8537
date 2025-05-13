const express = require("express");
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
  updateCustomer,
  updateStaff,
  forgotPassword,
  updatePassword,
} = require("../controllers/controllerUser");

// Các route có pattern cụ thể nên đặt trước các route có pattern chung hơn
router.get("/users/khachhang/tk/:idTK", getKhachHangByTK);
router.get("/users/nhanvien/tk/:idTK", getNhanVienByTK);
router.get("/staff", getAllNhanVien); // Endpoint to get all staff members

router.get("/users", getUser);
router.post("/register", registerUser);
router.get("/users/:id", getUserById);
router.get("/nhanvien", getAllNhanVien);
router.post("/login", loginUser);
router.post("/forgotpassword", forgotPassword);

// Import auth middleware
const authMiddleware = require("../middleware/auth");

// Protected routes that require authentication
// Các route có pattern cụ thể nên đặt trước các route có pattern chung hơn
router.put("/users/khachhang/:id", authMiddleware, updateCustomer);
router.put("/users/nhanvien/:id", authMiddleware, updateStaff);
router.put("/users/:id/password", authMiddleware, updatePassword);
router.put("/users/:id", authMiddleware, updateUser);
router.delete("/users/:id", authMiddleware, deleteUser);

// Dashboard statistics route
router.get("/dashboard/stats", getDashboardStats);

module.exports = router;
