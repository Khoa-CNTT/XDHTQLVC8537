const { connection } = require('../config/database');

// Get all reports
const getAllReports = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [reports] = await conn.query(`
            SELECT 
                bc.ID_BC, bc.Loai_BC, ql.TenQL, bc.NgayTao
            FROM BaoCao bc
            JOIN QuanLy ql ON bc.ID_QL = ql.ID_QL
            ORDER BY bc.NgayTao DESC
        `);

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Create financial report
const createFinancialReport = async (req, res) => {
    const { ID_QL, NgayBatDau, NgayKetThuc } = req.body;

    if (!ID_QL || !NgayBatDau || !NgayKetThuc) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // First, create the base report
        const [reportResult] = await conn.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC, NgayTao) VALUES (?, ?, NOW())',
            [ID_QL, 'TaiChinh']
        );

        const reportId = reportResult.insertId;

        // Calculate financial metrics for the period
        const [orderStats] = await conn.query(`
            SELECT 
                SUM(hh.DonGia * hh.SoLuong) as TienHang,
                SUM(dh.PhiGiaoHang) as TienThuHo,
                COUNT(dh.ID_DH) as TongDonHang
            FROM DonHang dh
            JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
            WHERE dh.NgayTaoDon BETWEEN ? AND ?
              AND dh.TrangThaiDonHang = 'Delivered'
        `, [NgayBatDau, NgayKetThuc]);

        // Create the financial report details
        await conn.query(`
            INSERT INTO BaoCaoTaiChinh 
            (ID_BC, NgayBatDau, NgayKetThuc, TienHang, TienThuHo, DoanhThu)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            reportId,
            NgayBatDau,
            NgayKetThuc,
            orderStats[0].TienHang || 0,
            orderStats[0].TienThuHo || 0,
            (orderStats[0].TienHang || 0) + (orderStats[0].TienThuHo || 0)
        ]);

        await conn.commit();

        res.status(201).json({
            success: true,
            message: 'Financial report created successfully',
            data: {
                reportId,
                totalOrders: orderStats[0].TongDonHang || 0,
                totalRevenue: (orderStats[0].TienHang || 0) + (orderStats[0].TienThuHo || 0)
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error creating financial report:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to create financial report'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Create staff performance report
const createStaffReport = async (req, res) => {
    const { ID_QL, ID_NV, NgayBaoCao } = req.body;

    if (!ID_QL || !ID_NV || !NgayBaoCao) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // First, create the base report
        const [reportResult] = await conn.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC, NgayTao) VALUES (?, ?, NOW())',
            [ID_QL, 'NhanVien']
        );

        const reportId = reportResult.insertId;

        // More implementation...

        await conn.commit();

        res.status(201).json({
            success: true,
            message: 'Staff report created successfully',
            data: {
                reportId
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error creating staff report:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to create staff report'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get financial report by ID
const getFinancialReportById = async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        // Implementation...
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Error fetching financial report:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch financial report'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get staff report by ID
const getStaffReportById = async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        // Implementation...
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Error fetching staff report:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff report'
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getAllReports,
    createFinancialReport,
    createStaffReport,
    getFinancialReportById,
    getStaffReportById
};
