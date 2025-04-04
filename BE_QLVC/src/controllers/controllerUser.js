const { connection } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SELECT } = require('sequelize/lib/query-types');
require('dotenv').config();
const validator = require('validator');

const createToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '3d' });
}

const getUser = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM TaiKhoan');
        res.json(rows);
    } catch (err) {
        console.error(err); // Debug: log error details
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
}

const registerUser = async (req, res) => {
    console.log('Received registration request:', req.body);

    const { Email, Matkhau, SDT, Role } = req.body;
    if (!validator.isEmail(Email)) {
        console.log('Invalid email:', Email);
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    // Check if email already exists
    let conn;
    try {
        conn = await connection.getConnection();

        // Check existing email
        const [existing] = await conn.query('SELECT * FROM TaiKhoan WHERE Email = ?', [Email]);
        if (existing.length > 0) {
            console.log('Email already exists:', Email);
            return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(Matkhau, 10);
        const sql = 'INSERT INTO TaiKhoan (Email, MatKhau, SDT, Role) VALUES (?, ?, ?, ?)';
        await conn.query(sql, [Email, hashedPassword, SDT, Role]);

        console.log('User registered successfully:', Email);
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
}

const getUserById = async (req, res) => {
    let conn;
    const id = req.params.id;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM TaiKhoan WHERE ID_TK = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
}

const updateUser = async (req, res) => {
    const id = req.params.id;
    const { Email, Matkhau, SDT, Role } = req.body;
    if (Email && !validator.isEmail(Email)) {
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    let conn;
    try {
        conn = await connection.getConnection();
        let hashedPassword;
        if (Matkhau) {
            hashedPassword = await bcrypt.hash(Matkhau, 10);
        }
        // Build dynamic update fields
        const fields = [];
        const values = [];
        if (Email) { fields.push("Email = ?"); values.push(Email); }
        if (Matkhau) { fields.push("MatKhau = ?"); values.push(hashedPassword); }
        if (SDT) { fields.push("SDT = ?"); values.push(SDT); }
        if (Role) { fields.push("Role = ?"); values.push(Role); }
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }
        const sql = `UPDATE TaiKhoan SET ${fields.join(', ')} WHERE ID_TK = ?`;
        values.push(id);
        const [result] = await conn.query(sql, values);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        res.json({ message: 'Cập nhật tài khoản thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

const deleteUser = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'DELETE FROM TaiKhoan WHERE ID_TK = ?';
        const [result] = await conn.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        res.json({ message: 'Xóa tài khoản thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

const loginUser = async (req, res) => {
    const { Email, Matkhau } = req.body;
    if (!Email || !Matkhau) {
        return res.status(400).json({ error: 'Email và Mật khẩu là bắt buộc' });
    }
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM TaiKhoan WHERE Email = ?', [Email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(Matkhau, user.MatKhau);
        if (!isMatch) return res.status(401).json({ error: 'Mật khẩu không đúng' });

        const token = createToken(user); // Tạo token JWT
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = { getUser, createToken, registerUser, getUserById, updateUser, deleteUser, loginUser };
