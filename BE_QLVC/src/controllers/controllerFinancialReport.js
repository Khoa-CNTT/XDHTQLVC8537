const db = require('../config/database');

/**
 * Lấy tất cả báo cáo tài chính
 */
exports.getAllFinancialReports = async (req, res) => {
    try {
        console.log('Starting getAllFinancialReports...');
        
        // Check if db.connection is available
        if (!db.connection) {
            throw new Error('Database connection not available');
        }
        
        const query = `
            SELECT bctc.*, bc.Loai_BC, ql.TenQL
            FROM BaoCaoTaiChinh bctc
            JOIN BaoCao bc ON bctc.ID_BC = bc.ID_BC
            JOIN QuanLy ql ON bc.ID_QL = ql.ID_QL
            ORDER BY bctc.NgayBatDau DESC
        `;
        
        console.log('Executing query:', query);
        
        const [reports] = await db.connection.query(query);
        
        console.log(`Retrieved ${reports ? reports.length : 0} reports`);
        
        res.status(200).json({
            success: true,
            data: reports,
            message: 'Lấy danh sách báo cáo tài chính thành công'
        });
    } catch (error) {
        console.error('Lỗi chi tiết khi lấy báo cáo tài chính:', error);
        
        // Log specific SQL errors if available
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
            console.error('SQL State:', error.sqlState);
            console.error('SQL Error Code:', error.code);
        }
        
        res.status(500).json({
            success: false,
            message: `Đã xảy ra lỗi khi lấy dữ liệu báo cáo tài chính: ${error.message}`
        });
    }
};

/**
 * Lấy báo cáo tài chính theo ID
 */
exports.getFinancialReportById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT bctc.*, bc.Loai_BC, ql.TenQL
            FROM BaoCaoTaiChinh bctc
            JOIN BaoCao bc ON bctc.ID_BC = bc.ID_BC
            JOIN QuanLy ql ON bc.ID_QL = ql.ID_QL
            WHERE bctc.ID_BCTC = ?
        `;
        
        const [report] = await db.query(query, [id]);
        
        if (!report.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo tài chính'
            });
        }
        
        res.status(200).json({
            success: true,
            data: report[0],
            message: 'Lấy báo cáo tài chính thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo tài chính theo ID:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo tài chính'
        });
    }
};

/**
 * Tạo báo cáo tài chính mới
 */
exports.createFinancialReport = async (req, res) => {
    try {
        const { 
            ID_QL, 
            ID_TT, 
            NgayBatDau, 
            NgayKetThuc, 
            TienShip, 
            TienThuHo, 
            DoanhThu 
        } = req.body;
        
        // Bắt đầu giao dịch
        await db.query('START TRANSACTION');
        
        // Tạo bản ghi trong bảng BaoCao
        const [baoCaoResult] = await db.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC) VALUES (?, ?)',
            [ID_QL, 'Báo cáo tài chính']
        );
        
        const ID_BC = baoCaoResult.insertId;
        
        // Tạo bản ghi trong bảng BaoCaoTaiChinh
        const [bctcResult] = await db.query(
            'INSERT INTO BaoCaoTaiChinh (ID_BC, ID_TT, NgayBatDau, NgayKetThuc, TienShip, TienThuHo, DoanhThu) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ID_BC, ID_TT, NgayBatDau, NgayKetThuc, TienShip, TienThuHo, DoanhThu]
        );
        
        // Commit giao dịch nếu mọi thứ OK
        await db.query('COMMIT');
        
        res.status(201).json({
            success: true,
            data: {
                ID_BCTC: bctcResult.insertId,
                ID_BC,
                ID_TT,
                NgayBatDau,
                NgayKetThuc,
                TienShip,
                TienThuHo,
                DoanhThu
            },
            message: 'Tạo báo cáo tài chính thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.query('ROLLBACK');
        
        console.error('Lỗi khi tạo báo cáo tài chính:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tạo báo cáo tài chính'
        });
    }
};

/**
 * Cập nhật báo cáo tài chính
 */
exports.updateFinancialReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            TienShip, 
            TienThuHo, 
            DoanhThu 
        } = req.body;
        
        // Kiểm tra báo cáo tồn tại
        const [checkReport] = await db.query(
            'SELECT * FROM BaoCaoTaiChinh WHERE ID_BCTC = ?',
            [id]
        );
        
        if (!checkReport.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo tài chính'
            });
        }
        
        // Cập nhật báo cáo tài chính
        await db.query(
            'UPDATE BaoCaoTaiChinh SET TienShip = ?, TienThuHo = ?, DoanhThu = ? WHERE ID_BCTC = ?',
            [TienShip, TienThuHo, DoanhThu, id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật báo cáo tài chính thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật báo cáo tài chính:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật báo cáo tài chính'
        });
    }
};

/**
 * Xóa báo cáo tài chính
 */
exports.deleteFinancialReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra báo cáo tồn tại
        const [checkReport] = await db.query(
            'SELECT ID_BC FROM BaoCaoTaiChinh WHERE ID_BCTC = ?',
            [id]
        );
        
        if (!checkReport.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo tài chính'
            });
        }
        
        const ID_BC = checkReport[0].ID_BC;
        
        // Bắt đầu giao dịch
        await db.query('START TRANSACTION');
        
        // Xóa báo cáo tài chính
        await db.query('DELETE FROM BaoCaoTaiChinh WHERE ID_BCTC = ?', [id]);
        
        // Xóa bản ghi tương ứng trong bảng BaoCao
        await db.query('DELETE FROM BaoCao WHERE ID_BC = ?', [ID_BC]);
        
        // Commit giao dịch
        await db.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Xóa báo cáo tài chính thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.query('ROLLBACK');
        
        console.error('Lỗi khi xóa báo cáo tài chính:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa báo cáo tài chính'
        });
    }
};

/**
 * Lấy báo cáo tài chính theo khoảng thời gian
 */
exports.getFinancialReportsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'
            });
        }
        
        const query = `
            SELECT bctc.*, bc.Loai_BC, ql.TenQL
            FROM BaoCaoTaiChinh bctc
            JOIN BaoCao bc ON bctc.ID_BC = bc.ID_BC
            JOIN QuanLy ql ON bc.ID_QL = ql.ID_QL
            WHERE (bctc.NgayBatDau BETWEEN ? AND ?) OR (bctc.NgayKetThuc BETWEEN ? AND ?)
            ORDER BY bctc.NgayBatDau DESC
        `;
        
        const [reports] = await db.query(query, [startDate, endDate, startDate, endDate]);
        
        res.status(200).json({
            success: true,
            data: reports,
            message: 'Lấy danh sách báo cáo tài chính theo khoảng thời gian thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo tài chính theo khoảng thời gian:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo tài chính'
        });
    }
};

/**
 * Tạo báo cáo tài chính tự động dựa trên dữ liệu đơn hàng
 */
exports.generateAutomaticFinancialReport = async (req, res) => {
    try {
        const { ID_QL, startDate, endDate } = req.body;
        
        if (!ID_QL || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin'
            });
        }
        
        // Truy vấn thông tin thanh toán trong khoảng thời gian
        const [financialStats] = await db.query(`
            SELECT 
                SUM(tt.TienShip) as TongTienShip,
                SUM(tt.TienThuHo) as TongTienThuHo
            FROM ThanhToan tt
            JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
            WHERE dh.NgayTaoDon BETWEEN ? AND ?
            AND dh.TrangThaiDonHang = 'Đã giao'
        `, [startDate, endDate]);
        
        // Lấy tổng tiền ship và tiền thu hộ
        const TienShip = financialStats[0]?.TongTienShip || 0;
        const TienThuHo = financialStats[0]?.TongTienThuHo || 0;
        
        // Tính doanh thu (tổng tiền ship + phần trăm từ tiền thu hộ)
        const DoanhThu = TienShip + (TienThuHo * 0.05); // Phí dịch vụ 5% tiền thu hộ
        
        // Bắt đầu giao dịch
        await db.query('START TRANSACTION');
        
        // Tạo bản ghi trong bảng BaoCao
        const [baoCaoResult] = await db.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC) VALUES (?, ?)',
            [ID_QL, 'Báo cáo tài chính tự động']
        );
        
        const ID_BC = baoCaoResult.insertId;
        
        // Lấy ID thanh toán mới nhất để tham chiếu (hoặc có thể bỏ qua nếu không cần thiết)
        const [latestPayment] = await db.query(
            'SELECT ID_TT FROM ThanhToan ORDER BY ID_TT DESC LIMIT 1'
        );
        
        const ID_TT = latestPayment.length > 0 ? latestPayment[0].ID_TT : null;
        
        // Tạo bản ghi trong bảng BaoCaoTaiChinh
        const [bctcResult] = await db.query(
            'INSERT INTO BaoCaoTaiChinh (ID_BC, ID_TT, NgayBatDau, NgayKetThuc, TienShip, TienThuHo, DoanhThu) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ID_BC, ID_TT, startDate, endDate, TienShip, TienThuHo, DoanhThu]
        );
        
        // Commit giao dịch
        await db.query('COMMIT');
        
        res.status(201).json({
            success: true,
            data: {
                ID_BCTC: bctcResult.insertId,
                ID_BC,
                ID_TT,
                NgayBatDau: startDate,
                NgayKetThuc: endDate,
                TienShip,
                TienThuHo,
                DoanhThu
            },
            message: 'Tạo báo cáo tài chính tự động thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.query('ROLLBACK');
        
        console.error('Lỗi khi tạo báo cáo tài chính tự động:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tạo báo cáo tài chính tự động'
        });
    }
};

/**
 * Lấy thống kê doanh thu theo thời gian
 */
exports.getRevenueStatistics = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        
        let query;
        let params = [];
        
        switch(period) {
            case 'day':
                query = `
                    SELECT 
                        DATE(dh.NgayTaoDon) as Date,
                        SUM(tt.TienShip) as TienShip,
                        SUM(tt.TienThuHo) as TienThuHo,
                        SUM(tt.TienShip + (tt.TienThuHo * 0.05)) as DoanhThu
                    FROM ThanhToan tt
                    JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
                    WHERE dh.NgayTaoDon BETWEEN ? AND ?
                    AND dh.TrangThaiDonHang = 'Đã giao'
                    GROUP BY DATE(dh.NgayTaoDon)
                    ORDER BY DATE(dh.NgayTaoDon)
                `;
                params = [startDate, endDate];
                break;
            case 'month':
                query = `
                    SELECT 
                        CONCAT(YEAR(dh.NgayTaoDon), '-', MONTH(dh.NgayTaoDon)) as Month,
                        SUM(tt.TienShip) as TienShip,
                        SUM(tt.TienThuHo) as TienThuHo,
                        SUM(tt.TienShip + (tt.TienThuHo * 0.05)) as DoanhThu
                    FROM ThanhToan tt
                    JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
                    WHERE dh.NgayTaoDon BETWEEN ? AND ?
                    AND dh.TrangThaiDonHang = 'Đã giao'
                    GROUP BY YEAR(dh.NgayTaoDon), MONTH(dh.NgayTaoDon)
                    ORDER BY YEAR(dh.NgayTaoDon), MONTH(dh.NgayTaoDon)
                `;
                params = [startDate, endDate];
                break;
            case 'year':
                query = `
                    SELECT 
                        YEAR(dh.NgayTaoDon) as Year,
                        SUM(tt.TienShip) as TienShip,
                        SUM(tt.TienThuHo) as TienThuHo,
                        SUM(tt.TienShip + (tt.TienThuHo * 0.05)) as DoanhThu
                    FROM ThanhToan tt
                    JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
                    WHERE dh.NgayTaoDon BETWEEN ? AND ?
                    AND dh.TrangThaiDonHang = 'Đã giao'
                    GROUP BY YEAR(dh.NgayTaoDon)
                    ORDER BY YEAR(dh.NgayTaoDon)
                `;
                params = [startDate, endDate];
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Phân kỳ không hợp lệ. Vui lòng sử dụng day, month hoặc year'
                });
        }
        
        const [stats] = await db.query(query, params);
        
        res.status(200).json({
            success: true,
            data: stats,
            message: 'Lấy thống kê doanh thu thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê doanh thu:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy thống kê doanh thu'
        });
    }
};
