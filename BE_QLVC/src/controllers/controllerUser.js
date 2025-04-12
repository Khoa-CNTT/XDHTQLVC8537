const { connection } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const validator = require('validator');

const createToken = (user) => {
    return jwt.sign({ ID_TK: user.ID_TK, Role: user.Role }, process.env.JWT_SECRET_KEY, {
        expiresIn: '3d',
    });
};

// Get all users with role-specific details
const getUser = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query(`
      SELECT tk.*,
        CASE 
          WHEN tk.Role = 'admin' THEN ql.TenQL
          WHEN tk.Role = 'staff' THEN nv.Ten_NV
          WHEN tk.Role = 'user' THEN kh.Ten_KH
        END as HoTen,
        CASE
          WHEN tk.Role = 'admin' THEN ql.DiaChi 
          WHEN tk.Role = 'staff' THEN nv.DiaChi
          WHEN tk.Role = 'user' THEN kh.DiaChi
          ELSE NULL
        END as DiaChi,
        nv.ID_NV,
        kh.ID_KH
      FROM TaiKhoan tk
      LEFT JOIN QuanLy ql ON tk.ID_TK = ql.ID_TK AND tk.Role = 'admin'
      LEFT JOIN NhanVien nv ON tk.ID_TK = nv.ID_TK AND tk.Role = 'staff'
      LEFT JOIN KhachHang kh ON tk.ID_TK = kh.ID_TK AND tk.Role = 'user'
    `);
        console.log('Fetched users:', rows);
        res.json({ success: true, data: rows, message: 'Danh sách tài khoản được lấy thành công' });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Register user
const registerUser = async (req, res) => {
    console.log('Received registration request:', req.body);

    const { Email, MatKhau, SDT, Role, HoTen, DiaChi } = req.body;

    if (!validator.isEmail(Email)) {
        console.log('Invalid email:', Email);
        return res.status(400).json({ success: false, error: 'Email không hợp lệ' });
    }

    if (!['admin', 'staff', 'user'].includes(Role)) {
        return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ' });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT * FROM TaiKhoan WHERE Email = ?', [Email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
        }

        const [existingPhone] = await conn.query('SELECT * FROM TaiKhoan WHERE SDT = ?', [SDT]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, error: 'Số điện thoại đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(MatKhau, 10);
        const [userResult] = await conn.query(
            'INSERT INTO TaiKhoan (Email, MatKhau, SDT, Role) VALUES (?, ?, ?, ?)',
            [Email, hashedPassword, SDT, Role]
        );

        const userId = userResult.insertId;

        if (Role === 'admin') {
            await conn.query('INSERT INTO QuanLy (ID_TK, TenQL, DiaChi) VALUES (?, ?, ?)', [
                userId, HoTen, DiaChi
            ]);
        } else if (Role === 'staff') {
            await conn.query('INSERT INTO NhanVien (ID_TK, Ten_NV, DiaChi) VALUES (?, ?, ?)', [
                userId, HoTen, DiaChi
            ]);
        } else if (Role === 'user') {
            await conn.query('INSERT INTO KhachHang (ID_TK, Ten_KH, DiaChi) VALUES (?, ?, ?)', [
                userId, HoTen, DiaChi
            ]);
        }

        await conn.commit();

        const token = createToken({ ID_TK: userId, Role });

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: { ID_TK: userId, token }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Get user by ID with role-specific details
const getUserById = async (req, res) => {
    let conn;
    const id = req.params.id;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query(
            `
      SELECT tk.*, 
        CASE 
          WHEN tk.Role = 'admin' THEN ql.TenQL
          WHEN tk.Role = 'staff' THEN nv.Ten_NV
          WHEN tk.Role = 'user' THEN kh.Ten_KH
        END as HoTen,
        CASE 
          WHEN tk.Role = 'admin' THEN ql.DiaChi
          WHEN tk.Role = 'staff' THEN nv.DiaChi
          WHEN tk.Role = 'user' THEN kh.DiaChi
        END as DiaChi,
        nv.ID_NV,
        kh.ID_KH
      FROM TaiKhoan tk
      LEFT JOIN QuanLy ql ON tk.ID_TK = ql.ID_TK
      LEFT JOIN NhanVien nv ON tk.ID_TK = nv.ID_TK
      LEFT JOIN KhachHang kh ON tk.ID_TK = kh.ID_TK
      WHERE tk.ID_TK = ?
    `,
            [id]
        );

        if (rows.length === 0) {
            return res
                .status(404)
                .json({ success: false, error: 'Không tìm thấy tài khoản' });
        }
        res.json({ success: true, data: rows[0], message: 'Lấy tài khoản thành công' });
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Update user and role-specific details
const updateUser = async (req, res) => {
    const id = req.params.id;
    const { Email, MatKhau, SDT, Role, HoTen, DiaChi } = req.body;

    if (Email && !validator.isEmail(Email)) {
        return res.status(400).json({ success: false, error: 'Email không hợp lệ' });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Update TaiKhoan
        const updateFields = [];
        const updateValues = [];

        if (Email) {
            updateFields.push('Email = ?');
            updateValues.push(Email);
        }
        if (MatKhau) {
            const hashedPassword = await bcrypt.hash(MatKhau, 10);
            updateFields.push('MatKhau = ?');
            updateValues.push(hashedPassword);
        }
        if (SDT) {
            updateFields.push('SDT = ?');
            updateValues.push(SDT);
        }
        if (Role) {
            if (!['admin', 'staff', 'user'].includes(Role)) {
                return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ' });
            }
            updateFields.push('Role = ?');
            updateValues.push(Role);
        }

        if (updateFields.length > 0) {
            const sql = `UPDATE TaiKhoan SET ${updateFields.join(', ')} WHERE ID_TK = ?`;
            updateValues.push(id);
            await conn.query(sql, updateValues);
        }

        // Get current user role
        const [currentUser] = await conn.query('SELECT Role FROM TaiKhoan WHERE ID_TK = ?', [id]);
        if (currentUser.length === 0) {
            throw new Error('Tài khoản không tồn tại');
        }
        const currentRole = currentUser[0].Role;
        const newRole = Role || currentRole;

        // Update role-specific table
        if (newRole === 'admin' || currentRole === 'admin') {
            const [existingAdmin] = await conn.query('SELECT * FROM QuanLy WHERE ID_TK = ?', [id]);
            if (existingAdmin.length > 0 && HoTen && DiaChi) {
                await conn.query('UPDATE QuanLy SET TenQL = ?, DiaChi = ? WHERE ID_TK = ?', [
                    HoTen,
                    DiaChi,
                    id,
                ]);
            } else if (newRole === 'admin' && !existingAdmin.length && HoTen && DiaChi) {
                await conn.query('INSERT INTO QuanLy (ID_TK, TenQL, DiaChi) VALUES (?, ?, ?)', [
                    id,
                    HoTen,
                    DiaChi,
                ]);
            }
        }

        if (newRole === 'staff' || currentRole === 'staff') {
            const [existingStaff] = await conn.query('SELECT * FROM NhanVien WHERE ID_TK = ?', [id]);
            if (existingStaff.length > 0 && HoTen && DiaChi) {
                await conn.query('UPDATE NhanVien SET Ten_NV = ?, DiaChi = ? WHERE ID_TK = ?', [
                    HoTen,
                    DiaChi,
                    id,
                ]);
            } else if (newRole === 'staff' && !existingStaff.length && HoTen && DiaChi) {
                await conn.query('INSERT INTO NhanVien (ID_TK, Ten_NV, DiaChi) VALUES (?, ?, ?)', [
                    id,
                    HoTen,
                    DiaChi,
                ]);
            }
        }

        if (newRole === 'user' || currentRole === 'user') {
            const [existingUser] = await conn.query('SELECT * FROM KhachHang WHERE ID_TK = ?', [id]);
            if (existingUser.length > 0 && HoTen && DiaChi) {
                await conn.query('UPDATE KhachHang SET Ten_KH = ?, DiaChi = ? WHERE ID_TK = ?', [
                    HoTen,
                    DiaChi,
                    id,
                ]);
            } else if (newRole === 'user' && !existingUser.length && HoTen && DiaChi) {
                await conn.query('INSERT INTO KhachHang (ID_TK, Ten_KH, DiaChi) VALUES (?, ?, ?)', [
                    id,
                    HoTen,
                    DiaChi,
                ]);
            }
        }

        await conn.commit();
        res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Update error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Delete user and role-specific details
const deleteUser = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Get user role
        const [user] = await conn.query('SELECT Role FROM TaiKhoan WHERE ID_TK = ?', [id]);
        if (user.length === 0) {
            return res
                .status(404)
                .json({ success: false, error: 'Tài khoản không tồn tại' });
        }

        // Delete from role-specific table
        if (user[0].Role === 'admin') {
            await conn.query('DELETE FROM QuanLy WHERE ID_TK = ?', [id]);
        } else if (user[0].Role === 'staff') {
            await conn.query('DELETE FROM NhanVien WHERE ID_TK = ?', [id]);
        } else if (user[0].Role === 'user') {
            await conn.query('DELETE FROM KhachHang WHERE ID_TK = ?', [id]);
        }

        // Delete from TaiKhoan
        await conn.query('DELETE FROM TaiKhoan WHERE ID_TK = ?', [id]);

        await conn.commit();
        res.json({ success: true, message: 'Xóa tài khoản thành công' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Delete error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Login user
const loginUser = async (req, res) => {
    const { Email, Matkhau } = req.body;

    if (!Email || !Matkhau) {
        return res
            .status(400)
            .json({ success: false, error: 'Email và Mật khẩu là bắt buộc' });
    }

    let conn;
    try {
        conn = await connection.getConnection();

        // Check if account exists
        const [rows] = await conn.query('SELECT * FROM TaiKhoan WHERE Email = ?', [Email]);
        if (rows.length === 0) {
            return res
                .status(404)
                .json({ success: false, error: 'Tài khoản không tồn tại' });
        }

        const user = rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(Matkhau, user.MatKhau);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Mật khẩu không chính xác' });
        }

        // Create JWT
        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                ID_TK: user.ID_TK,
                Role: user.Role,
                token
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
// Lấy thông tin Khách Hàng theo ID_TK including Email and SDT
const getKhachHangByTK = async (req, res) => {
    const { idTK } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        // Join KhachHang with TaiKhoan
        const [rows] = await conn.query(`
            SELECT kh.*, tk.Email, tk.SDT 
            FROM KhachHang kh
            JOIN TaiKhoan tk ON kh.ID_TK = tk.ID_TK
            WHERE kh.ID_TK = ?
        `, [idTK]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching KhachHang by TK:', err); // Add logging
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
// Lấy thông tin Nhân Viên theo ID_TK including Email and SDT
const getNhanVienByTK = async (req, res) => {
    const { idTK } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        // Join NhanVien with TaiKhoan
        const [rows] = await conn.query(`
            SELECT nv.*, tk.Email, tk.SDT 
            FROM NhanVien nv
            JOIN TaiKhoan tk ON nv.ID_TK = tk.ID_TK
            WHERE nv.ID_TK = ?
        `, [idTK]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy nhân viên' });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching NhanVien by TK:', err); // Add logging
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Lấy danh sách tất cả nhân viên
const getAllNhanVien = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query(`
            SELECT nv.*, tk.Email, tk.SDT as SoDienThoai
            FROM NhanVien nv
            JOIN TaiKhoan tk ON nv.ID_TK = tk.ID_TK
            WHERE tk.Role = 'staff'
        `);

        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching staff list:', err);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();

        // Get total orders
        const [totalOrders] = await conn.query('SELECT COUNT(*) as total FROM DonHang');

        // Get orders by status
        const [pendingOrders] = await conn.query("SELECT COUNT(*) as count FROM DonHang WHERE TrangThaiDonHang = 'Pending'");
        const [deliveredOrders] = await conn.query("SELECT COUNT(*) as count FROM DonHang WHERE TrangThaiDonHang = 'Delivered'");
        const [cancelledOrders] = await conn.query("SELECT COUNT(*) as count FROM DonHang WHERE TrangThaiDonHang = 'Cancelled'");

        // Get total customers
        const [totalCustomers] = await conn.query('SELECT COUNT(*) as total FROM KhachHang');

        // Get total staff
        const [totalStaff] = await conn.query('SELECT COUNT(*) as total FROM NhanVien');

        // Get recent orders (last 5)
        const [recentOrders] = await conn.query(`
            SELECT 
                dh.ID_DH, dh.MaVanDon, dh.NgayTaoDon, dh.TrangThaiDonHang,
                kh.Ten_KH, hh.TenHH
            FROM DonHang dh
            LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
            LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
            ORDER BY dh.NgayTaoDon DESC
            LIMIT 5
        `);

        // Get top staff by orders
        const [topStaff] = await conn.query(`
            SELECT 
                nv.ID_NV, nv.Ten_NV, COUNT(dh.ID_DH) as orderCount
            FROM NhanVien nv
            LEFT JOIN DonHang dh ON nv.ID_NV = dh.ID_NV
            GROUP BY nv.ID_NV
            ORDER BY orderCount DESC
            LIMIT 5
        `);

        res.status(200).json({
            success: true,
            data: {
                totalOrders: totalOrders[0].total,
                ordersByStatus: {
                    pending: pendingOrders[0].count,
                    delivered: deliveredOrders[0].count,
                    cancelled: cancelledOrders[0].count
                },
                totalCustomers: totalCustomers[0].total,
                totalStaff: totalStaff[0].total,
                recentOrders,
                topStaff
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Export the new function
module.exports = {
    getUser,
    createToken,
    registerUser,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
    getKhachHangByTK,
    getNhanVienByTK,
    getAllNhanVien,
    getDashboardStats,
};