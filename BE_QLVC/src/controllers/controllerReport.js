const { connection } = require('../config/database');

// Thống kê tiền hàng theo tháng hoặc năm
const getRevenueStats = async (req, res) => {
    const { periodType = 'month', year } = req.query;
    const selectedYear = parseInt(year) || new Date().getFullYear();
    
    let conn;
    try {
        conn = await connection.getConnection();
        
        let query, params;
          if (periodType === 'month') {
            // Thống kê theo từng tháng trong năm được chọn
            query = `
                SELECT 
                    MONTH(dh.NgayTaoDon) AS period,
                    COUNT(dh.ID_DH) AS totalOrders,
                    SUM(IFNULL(tt.TienThuHo, 0)) AS totalCodAmount,
                    SUM(IFNULL(dh.PhiGiaoHang, 0)) AS totalShippingFee
                FROM DonHang dh
                LEFT JOIN ThanhToan tt ON dh.ID_DH = tt.ID_DH
                WHERE YEAR(dh.NgayTaoDon) = ?
                GROUP BY MONTH(dh.NgayTaoDon)
                ORDER BY MONTH(dh.NgayTaoDon)
            `;
            params = [selectedYear];
        } else {
            // Thống kê theo năm (5 năm gần nhất)
            query = `
                SELECT 
                    YEAR(dh.NgayTaoDon) AS period,
                    COUNT(dh.ID_DH) AS totalOrders,
                    SUM(IFNULL(tt.TienThuHo, 0)) AS totalCodAmount,
                    SUM(IFNULL(dh.PhiGiaoHang, 0)) AS totalShippingFee
                FROM DonHang dh
                LEFT JOIN ThanhToan tt ON dh.ID_DH = tt.ID_DH
                WHERE YEAR(dh.NgayTaoDon) >= YEAR(NOW()) - 4
                GROUP BY YEAR(dh.NgayTaoDon)
                ORDER BY YEAR(dh.NgayTaoDon)
            `;
            params = [];
        }

        const [revenueStats] = await conn.query(query, params);

        // Tính tổng
        let totalOrders = 0;
        let totalCodAmount = 0;
        let totalShippingFee = 0;
        
        // Chuẩn bị dữ liệu để trả về frontend
        const stats = {
            labels: [],
            orderCounts: [],
            codAmounts: [],
            shippingFees: [],
            totalOrders: 0,
            totalCodAmount: 0,
            totalShippingFee: 0
        };
        
        // Nếu là thống kê theo tháng, đảm bảo có đủ 12 tháng
        if (periodType === 'month') {
            for (let i = 1; i <= 12; i++) {
                const monthData = revenueStats.find(item => item.period === i) || {
                    period: i,
                    totalOrders: 0,
                    totalCodAmount: 0,
                    totalShippingFee: 0
                };
                
                stats.labels.push(`T${i}`);
                stats.orderCounts.push(parseInt(monthData.totalOrders) || 0);
                stats.codAmounts.push(parseInt(monthData.totalCodAmount) || 0);
                stats.shippingFees.push(parseInt(monthData.totalShippingFee) || 0);
                
                totalOrders += parseInt(monthData.totalOrders) || 0;
                totalCodAmount += parseInt(monthData.totalCodAmount) || 0;
                totalShippingFee += parseInt(monthData.totalShippingFee) || 0;
            }
        } else {
            // Nếu là thống kê theo năm, lấy dữ liệu 5 năm gần nhất
            const currentYear = new Date().getFullYear();
            for (let i = 0; i < 5; i++) {
                const year = currentYear - i;
                const yearData = revenueStats.find(item => item.period === year) || {
                    period: year,
                    totalOrders: 0,
                    totalCodAmount: 0,
                    totalShippingFee: 0
                };
                
                stats.labels.push(year.toString());
                stats.orderCounts.push(parseInt(yearData.totalOrders) || 0);
                stats.codAmounts.push(parseInt(yearData.totalCodAmount) || 0);
                stats.shippingFees.push(parseInt(yearData.totalShippingFee) || 0);
                
                totalOrders += parseInt(yearData.totalOrders) || 0;
                totalCodAmount += parseInt(yearData.totalCodAmount) || 0;
                totalShippingFee += parseInt(yearData.totalShippingFee) || 0;
            }
            
            // Đảo ngược mảng để hiển thị từ năm cũ đến năm mới
            stats.labels.reverse();
            stats.orderCounts.reverse();
            stats.codAmounts.reverse();
            stats.shippingFees.reverse();
        }
        
        stats.totalOrders = totalOrders;
        stats.totalCodAmount = totalCodAmount;
        stats.totalShippingFee = totalShippingFee;
        
        res.status(200).json({
            success: true,
            data: stats
        });
        
    } catch (err) {
        console.error('Error fetching revenue stats:', err);
        res.status(500).json({
            success: false,
            error: 'Không thể lấy thống kê doanh thu'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get revenue data by period (6 or 12 months)
const getRevenueByPeriod = async (req, res) => {
    const { period = 6 } = req.query;
    const months = parseInt(period) || 6;

    let conn;
    try {
        conn = await connection.getConnection();

        // Get revenue data for the last N months
        const [revenueData] = await conn.query(`
            SELECT 
                MONTH(dh.NgayTaoDon) AS month,
                SUM(hh.DonGia * hh.SoLuong + dh.PhiGiaoHang) AS value
            FROM DonHang dh
            JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
            WHERE dh.NgayTaoDon >= DATE_SUB(NOW(), INTERVAL ? MONTH)
              AND dh.TrangThaiDonHang = 'Delivered'
            GROUP BY MONTH(dh.NgayTaoDon)
            ORDER BY MONTH(dh.NgayTaoDon)
        `, [months]);

        // Transform data into the format expected by the frontend
        const formattedData = revenueData.map(item => ({
            label: `T${item.month}`,
            value: parseInt(item.value) || 0
        }));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (err) {
        console.error('Error fetching revenue data:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue data'
        });
    } finally {
        if (conn) conn.release();
    }
};

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
    getStaffReportById,
    getRevenueByPeriod,
    getRevenueStats
};
