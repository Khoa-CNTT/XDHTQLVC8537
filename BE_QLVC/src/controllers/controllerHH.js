const { connection } = require('../config/database');

// Functions for LoaiHH
const getLoaiHH = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM LoaiHH');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const createLoaiHH = async (req, res) => {
    const { TenLoaiHH } = req.body;
    if (!TenLoaiHH) return res.status(400).json({ error: 'TenLoaiHH is required' });
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'INSERT INTO LoaiHH (TenLoaiHH) VALUES (?)';
        const [result] = await conn.query(sql, [TenLoaiHH]);
        res.status(201).json({ message: 'LoaiHH created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const updateLoaiHH = async (req, res) => {
    const id = req.params.id;
    const { TenLoaiHH } = req.body;
    if (!TenLoaiHH) return res.status(400).json({ error: 'TenLoaiHH is required' });
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'UPDATE LoaiHH SET TenLoaiHH = ? WHERE ID_LHH = ?';
        const [result] = await conn.query(sql, [TenLoaiHH, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'LoaiHH not found' });
        res.json({ message: 'LoaiHH updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const deleteLoaiHH = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'DELETE FROM LoaiHH WHERE ID_LHH = ?';
        const [result] = await conn.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'LoaiHH not found' });
        res.json({ message: 'LoaiHH deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Functions for TinhChatHH
const getTinhChatHH = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM TinhChatHH');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const createTinhChatHH = async (req, res) => {
    const { TenTCHH } = req.body;
    if (!TenTCHH) return res.status(400).json({ error: 'TenTCHH is required' });
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'INSERT INTO TinhChatHH (TenTCHH) VALUES (?)';
        const [result] = await conn.query(sql, [TenTCHH]);
        res.status(201).json({ message: 'TinhChatHH created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const updateTinhChatHH = async (req, res) => {
    const id = req.params.id;
    const { TenTCHH } = req.body;
    if (!TenTCHH) return res.status(400).json({ error: 'TenTCHH is required' });
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'UPDATE TinhChatHH SET TenTCHH = ? WHERE ID_TCHH = ?';
        const [result] = await conn.query(sql, [TenTCHH, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'TinhChatHH not found' });
        res.json({ message: 'TinhChatHH updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const deleteTinhChatHH = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'DELETE FROM TinhChatHH WHERE ID_TCHH = ?';
        const [result] = await conn.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'TinhChatHH not found' });
        res.json({ message: 'TinhChatHH deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Functions for HangHoa
const getHangHoa = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM HangHoa');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const createHangHoa = async (req, res) => {
    const { ID_LHH, ID_TCHH, TenHH, SoLuong, TrongLuong, DonGia, image } = req.body;
    if (!ID_LHH || !ID_TCHH || !TenHH || !SoLuong || !TrongLuong || !DonGia || !image) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'INSERT INTO HangHoa (ID_LHH, ID_TCHH, TenHH, SoLuong, TrongLuong, DonGia, image) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await conn.query(sql, [ID_LHH, ID_TCHH, TenHH, SoLuong, TrongLuong, DonGia, image]);
        res.status(201).json({ message: 'HangHoa created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const updateHangHoa = async (req, res) => {
    const id = req.params.id;
    const { ID_LHH, ID_TCHH, TenHH, SoLuong, TrongLuong, DonGia, image } = req.body;
    if (!ID_LHH || !ID_TCHH || !TenHH || !SoLuong || !TrongLuong || !DonGia || !image) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'UPDATE HangHoa SET ID_LHH = ?, ID_TCHH = ?, TenHH = ?, SoLuong = ?, TrongLuong = ?, DonGia = ?, image = ? WHERE ID_HH = ?';
        const [result] = await conn.query(sql, [ID_LHH, ID_TCHH, TenHH, SoLuong, TrongLuong, DonGia, image, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'HangHoa not found' });
        res.json({ message: 'HangHoa updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
const deleteHangHoa = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'DELETE FROM HangHoa WHERE ID_HH = ?';
        const [result] = await conn.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'HangHoa not found' });
        res.json({ message: 'HangHoa deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// New function: Get HangHoa by LoaiHH
const getHangHoaByLoai = async (req, res) => {
    const idLoai = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM HangHoa WHERE ID_LHH = ?', [idLoai]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// New function: Get HangHoa by TinhChatHH
const getHangHoaByTinh = async (req, res) => {
    const idTinh = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const [rows] = await conn.query('SELECT * FROM HangHoa WHERE ID_TCHH = ?', [idTinh]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getLoaiHH,
    createLoaiHH,
    updateLoaiHH,
    deleteLoaiHH,
    getTinhChatHH,
    createTinhChatHH,
    updateTinhChatHH,
    deleteTinhChatHH,
    getHangHoa,
    createHangHoa,
    updateHangHoa,
    deleteHangHoa,
    getHangHoaByLoai,
    getHangHoaByTinh // added new export
};
