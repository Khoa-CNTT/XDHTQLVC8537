const { connection } = require('../config/database');
const { createOrderStatusNotification } = require('./controllerNotification');

// Get all DonHang with related data
const getDonHang = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      ORDER BY dh.NgayTaoDon DESC
    `;
        const [rows] = await conn.query(sql);
        res.json({
            success: true,
            data: rows,
            message: 'Danh sách đơn hàng được lấy thành công',
        });
    } catch (err) {
        console.error('Error fetching DonHang:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get a single DonHang by ID
const getDonHangById = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      WHERE dh.ID_DH = ?
    `;
        const [rows] = await conn.query(sql, [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }
        res.json({
            success: true,
            data: rows[0],
            message: 'Đơn hàng được lấy thành công',
        });
    } catch (err) {
        console.error('Error fetching DonHang:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Create a new DonHang
const createDonHang = async (req, res) => {
    const {
        ID_NV,
        ID_KH,
        ID_HH,
        receiverName,
        receiverAddress,
        receiverPhone,
        MaVanDon,
        NgayTaoDon,
        NgayGiaoDuKien,
        TrangThaiDonHang,
        PhiGiaoHang,
        GhiChu,
    } = req.body;

    // Validate required fields
    if (!ID_NV || !ID_KH || !ID_HH || !receiverName || !receiverAddress || !receiverPhone || !MaVanDon || !NgayTaoDon || !TrangThaiDonHang || PhiGiaoHang === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc (ID_NV, ID_KH, ID_HH, receiverName, receiverAddress, receiverPhone, MaVanDon, NgayTaoDon, TrangThaiDonHang, PhiGiaoHang)',
        });
    }

    // Validate TrangThaiDonHang
    const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(TrangThaiDonHang)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái đơn hàng không hợp lệ. Phải là Pending, Delivered hoặc Cancelled',
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Validate foreign keys
        const [nv] = await conn.query('SELECT ID_NV FROM NhanVien WHERE ID_NV = ?', [ID_NV]);
        const [kh] = await conn.query('SELECT ID_KH FROM KhachHang WHERE ID_KH = ?', [ID_KH]);
        const [hh] = await conn.query('SELECT ID_HH FROM HangHoa WHERE ID_HH = ?', [ID_HH]);

        if (nv.length === 0 || kh.length === 0 || hh.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Một hoặc nhiều ID không hợp lệ (ID_NV, ID_KH, ID_HH)',
            });
        }

        // Create NguoiNhan
        const [nnResult] = await conn.query(
            'INSERT INTO NguoiNhan (Ten_NN, DiaChi, SDT) VALUES (?, ?, ?)',
            [receiverName, receiverAddress, receiverPhone]
        );
        const ID_NN = nnResult.insertId;

        // Create DonHang
        const sql = `
      INSERT INTO DonHang (
        ID_NV, ID_KH, ID_HH, ID_NN, MaVanDon, NgayTaoDon, 
        NgayGiaoDuKien, TrangThaiDonHang, PhiGiaoHang, GhiChu
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await conn.query(sql, [
            ID_NV,
            ID_KH,
            ID_HH,
            ID_NN,
            MaVanDon,
            NgayTaoDon,
            NgayGiaoDuKien || null,
            TrangThaiDonHang,
            PhiGiaoHang,
            GhiChu || null,
        ]);

        const orderId = result.insertId;

        // Create notification
        await createOrderStatusNotification(orderId, TrangThaiDonHang);

        await conn.commit();
        res.status(201).json({
            success: true,
            data: { ID_DH: orderId },
            message: 'Đơn hàng được tạo thành công',
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error creating DonHang:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Update DonHang status (for staff)
const updateDonHangStatus = async (req, res) => {
    const id = req.params.id;
    const { TrangThaiDonHang } = req.body;

    // Validate required field
    if (!TrangThaiDonHang) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu trạng thái đơn hàng',
        });
    }

    // Validate TrangThaiDonHang
    const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(TrangThaiDonHang)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái đơn hàng không hợp lệ. Phải là Pending, Delivered hoặc Cancelled',
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      UPDATE DonHang
      SET TrangThaiDonHang = ?,
          NgayGiaoThucTe = ?
      WHERE ID_DH = ?
    `;
        const NgayGiaoThucTe = TrangThaiDonHang === 'Delivered' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        const [result] = await conn.query(sql, [TrangThaiDonHang, NgayGiaoThucTe, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        // Create notification for status change
        await createOrderStatusNotification(id, TrangThaiDonHang);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
        });
    } catch (err) {
        console.error('Error updating DonHang status:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Update a DonHang (full update)
const updateDonHang = async (req, res) => {
    const id = req.params.id;
    const {
        ID_NV,
        ID_KH,
        ID_HH,
        ID_NN,
        MaVanDon,
        NgayTaoDon,
        NgayGiaoDuKien,
        NgayGiaoThucTe,
        TrangThaiDonHang,
        PhiGiaoHang,
        GhiChu,
    } = req.body;

    // Validate required fields
    if (!ID_NV || !ID_KH || !ID_HH || !ID_NN || !MaVanDon || !NgayTaoDon || !TrangThaiDonHang || PhiGiaoHang === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc (ID_NV, ID_KH, ID_HH, ID_NN, MaVanDon, NgayTaoDon, TrangThaiDonHang, PhiGiaoHang)',
        });
    }

    // Validate TrangThaiDonHang
    const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(TrangThaiDonHang)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái đơn hàng không hợp lệ. Phải là Pending, Delivered hoặc Cancelled',
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();

        // Validate foreign keys
        const [nv] = await conn.query('SELECT ID_NV FROM NhanVien WHERE ID_NV = ?', [ID_NV]);
        const [kh] = await conn.query('SELECT ID_KH FROM KhachHang WHERE ID_KH = ?', [ID_KH]);
        const [hh] = await conn.query('SELECT ID_HH FROM HangHoa WHERE ID_HH = ?', [ID_HH]);
        const [nn] = await conn.query('SELECT ID_NN FROM NguoiNhan WHERE ID_NN = ?', [ID_NN]);

        if (nv.length === 0 || kh.length === 0 || hh.length === 0 || nn.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Một hoặc nhiều ID không hợp lệ (ID_NV, ID_KH, ID_HH, ID_NN)',
            });
        }

        const sql = `
      UPDATE DonHang
      SET 
        ID_NV = ?, ID_KH = ?, ID_HH = ?, ID_NN = ?, 
        MaVanDon = ?, NgayTaoDon = ?, NgayGiaoDuKien = ?, 
        NgayGiaoThucTe = ?, TrangThaiDonHang = ?, PhiGiaoHang = ?, GhiChu = ?
      WHERE ID_DH = ?
    `;
        const [result] = await conn.query(sql, [
            ID_NV,
            ID_KH,
            ID_HH,
            ID_NN,
            MaVanDon,
            NgayTaoDon,
            NgayGiaoDuKien || null,
            NgayGiaoThucTe || null,
            TrangThaiDonHang,
            PhiGiaoHang,
            GhiChu || null,
            id,
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }
        res.json({
            success: true,
            message: 'Đơn hàng được cập nhật thành công',
        });
    } catch (err) {
        console.error('Error updating DonHang:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Delete a DonHang
const deleteDonHang = async (req, res) => {
    const id = req.params.id;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = 'DELETE FROM DonHang WHERE ID_DH = ?';
        const [result] = await conn.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }
        res.json({
            success: true,
            message: 'Đơn hàng đã được xóa thành công',
        });
    } catch (err) {
        console.error('Error deleting DonHang:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get DonHang by Status
const getDonHangByStatus = async (req, res) => {
    const status = req.params.status;
    // Validate status
    const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái đơn hàng không hợp lệ. Phải là Pending, Delivered hoặc Cancelled',
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      WHERE dh.TrangThaiDonHang = ?
      ORDER BY dh.NgayTaoDon DESC
    `;
        const [rows] = await conn.query(sql, [status]);
        res.json({
            success: true,
            data: rows,
            message: `Danh sách đơn hàng với trạng thái ${status} được lấy thành công`,
        });
    } catch (err) {
        console.error('Error fetching DonHang by status:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng theo trạng thái',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get DonHang by Customer
const getDonHangByCustomer = async (req, res) => {
    const idKH = req.params.idKH;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      WHERE dh.ID_KH = ?
      ORDER BY dh.NgayTaoDon DESC
    `;
        const [rows] = await conn.query(sql, [idKH]);
        res.json({
            success: true,
            data: rows,
            message: `Danh sách đơn hàng của khách hàng ${idKH} được lấy thành công`,
        });
    } catch (err) {
        console.error('Error fetching DonHang by customer:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng theo khách hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get DonHang by Staff
const getDonHangByStaff = async (req, res) => {
    const idNV = req.params.idNV;
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      WHERE dh.ID_NV = ?
      ORDER BY dh.NgayTaoDon DESC
    `;
        const [rows] = await conn.query(sql, [idNV]);
        res.json({
            success: true,
            data: rows,
            message: `Danh sách đơn hàng của nhân viên ${idNV} được lấy thành công`,
        });
    } catch (err) {
        console.error('Error fetching DonHang by staff:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get DonHang by Date Range
const getDonHangByDateRange = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp startDate và endDate',
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        nv.ID_NV,
        nv.Ten_NV,
        kh.ID_KH,
        kh.Ten_KH,
        hh.ID_HH,
        hh.TenHH,
        nn.ID_NN,
        nn.Ten_NN,
        nn.DiaChi AS DiaChiNguoiNhan,
        nn.SDT AS SDTNguoiNhan
      FROM DonHang dh
      LEFT JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      LEFT JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      LEFT JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      WHERE dh.NgayTaoDon BETWEEN ? AND ?
      ORDER BY dh.NgayTaoDon DESC
    `;
        const [rows] = await conn.query(sql, [startDate, endDate]);
        res.json({
            success: true,
            data: rows,
            message: `Danh sách đơn hàng từ ${startDate} đến ${endDate} được lấy thành công`,
        });
    } catch (err) {
        console.error('Error fetching DonHang by date range:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng theo khoảng thời gian',
            error: err.message,
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
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
};