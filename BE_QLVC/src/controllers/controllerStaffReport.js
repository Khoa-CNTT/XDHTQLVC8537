const db = require('../config/database');

/**
 * Lấy tất cả báo cáo nhân viên
 */
exports.getAllStaffReports = async (req, res) => {
    try {
        console.log('Starting getAllStaffReports...');
        
        // Check if db.connection is available
        if (!db.connection) {
            throw new Error('Database connection not available');
        }
        
        const query = `
            SELECT bcnv.*, bc.Loai_BC, nv.Ten_NV
            FROM BaoCaoNhanVien bcnv
            JOIN BaoCao bc ON bcnv.ID_BC = bc.ID_BC
            JOIN NhanVien nv ON bcnv.ID_NV = nv.ID_NV
            ORDER BY bcnv.NgayBaoCao DESC
        `;
        
        console.log('Executing staff reports query:', query);
        
        const [reports] = await db.connection.query(query);
        
        console.log(`Retrieved ${reports ? reports.length : 0} staff reports`);
        
        res.status(200).json({
            success: true,
            data: reports,
            message: 'Lấy danh sách báo cáo nhân viên thành công'
        });
    } catch (error) {
        console.error('Lỗi chi tiết khi lấy báo cáo nhân viên:', error);
        
        // Log specific SQL errors if available
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
            console.error('SQL State:', error.sqlState);
            console.error('SQL Error Code:', error.code);
        }
        
        res.status(500).json({
            success: false,
            message: `Đã xảy ra lỗi khi lấy dữ liệu báo cáo nhân viên: ${error.message}`
        });
    }
};

/**
 * Lấy báo cáo nhân viên theo ID
 */
exports.getStaffReportById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT bcnv.*, bc.Loai_BC, nv.Ten_NV
            FROM BaoCaoNhanVien bcnv
            JOIN BaoCao bc ON bcnv.ID_BC = bc.ID_BC
            JOIN NhanVien nv ON bcnv.ID_NV = nv.ID_NV
            WHERE bcnv.ID_BCNV = ?
        `;
        
        const [report] = await db.query(query, [id]);
        
        if (!report.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo nhân viên'
            });
        }
        
        res.status(200).json({
            success: true,
            data: report[0],
            message: 'Lấy báo cáo nhân viên thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo nhân viên theo ID:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo nhân viên'
        });
    }
};

/**
 * Tạo báo cáo nhân viên mới
 */
exports.createStaffReport = async (req, res) => {
    try {
        const { ID_QL, ID_NV, NgayBaoCao, SoDonGiao, SoDonTre, DanhGiaHieuSuat } = req.body;
        
        // Bắt đầu giao dịch
        await db.query('START TRANSACTION');
        
        // Tạo bản ghi trong bảng BaoCao
        const [baoCaoResult] = await db.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC) VALUES (?, ?)',
            [ID_QL, 'Báo cáo nhân viên']
        );
        
        const ID_BC = baoCaoResult.insertId;
        
        // Tạo bản ghi trong bảng BaoCaoNhanVien
        const [bcnvResult] = await db.query(
            'INSERT INTO BaoCaoNhanVien (ID_BC, ID_NV, NgayBaoCao, SoDonGiao, SoDonTre, DanhGiaHieuSuat) VALUES (?, ?, ?, ?, ?, ?)',
            [ID_BC, ID_NV, NgayBaoCao, SoDonGiao, SoDonTre, DanhGiaHieuSuat]
        );
        
        // Commit giao dịch nếu mọi thứ OK
        await db.query('COMMIT');
        
        res.status(201).json({
            success: true,
            data: {
                ID_BCNV: bcnvResult.insertId,
                ID_BC,
                ID_NV,
                NgayBaoCao,
                SoDonGiao,
                SoDonTre,
                DanhGiaHieuSuat
            },
            message: 'Tạo báo cáo nhân viên thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.query('ROLLBACK');
        
        console.error('Lỗi khi tạo báo cáo nhân viên:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tạo báo cáo nhân viên'
        });
    }
};

/**
 * Cập nhật báo cáo nhân viên
 */
exports.updateStaffReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { SoDonGiao, SoDonTre, DanhGiaHieuSuat } = req.body;
        
        // Kiểm tra báo cáo tồn tại
        const [checkReport] = await db.query(
            'SELECT * FROM BaoCaoNhanVien WHERE ID_BCNV = ?',
            [id]
        );
        
        if (!checkReport.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo nhân viên'
            });
        }
        
        // Cập nhật báo cáo nhân viên
        await db.query(
            'UPDATE BaoCaoNhanVien SET SoDonGiao = ?, SoDonTre = ?, DanhGiaHieuSuat = ? WHERE ID_BCNV = ?',
            [SoDonGiao, SoDonTre, DanhGiaHieuSuat, id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật báo cáo nhân viên thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật báo cáo nhân viên:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật báo cáo nhân viên'
        });
    }
};

/**
 * Xóa báo cáo nhân viên
 */
exports.deleteStaffReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra báo cáo tồn tại
        const [checkReport] = await db.query(
            'SELECT ID_BC FROM BaoCaoNhanVien WHERE ID_BCNV = ?',
            [id]
        );
        
        if (!checkReport.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo nhân viên'
            });
        }
        
        const ID_BC = checkReport[0].ID_BC;
        
        // Bắt đầu giao dịch
        await db.query('START TRANSACTION');
        
        // Xóa báo cáo nhân viên
        await db.query('DELETE FROM BaoCaoNhanVien WHERE ID_BCNV = ?', [id]);
        
        // Xóa bản ghi tương ứng trong bảng BaoCao
        await db.query('DELETE FROM BaoCao WHERE ID_BC = ?', [ID_BC]);
        
        // Commit giao dịch
        await db.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Xóa báo cáo nhân viên thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.query('ROLLBACK');
        
        console.error('Lỗi khi xóa báo cáo nhân viên:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa báo cáo nhân viên'
        });
    }
};

/**
 * Lấy báo cáo nhân viên theo khoảng thời gian
 */
exports.getStaffReportsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'
            });
        }
        
        const query = `
            SELECT bcnv.*, bc.Loai_BC, nv.Ten_NV
            FROM BaoCaoNhanVien bcnv
            JOIN BaoCao bc ON bcnv.ID_BC = bc.ID_BC
            JOIN NhanVien nv ON bcnv.ID_NV = nv.ID_NV
            WHERE bcnv.NgayBaoCao BETWEEN ? AND ?
            ORDER BY bcnv.NgayBaoCao DESC
        `;
        
        const [reports] = await db.query(query, [startDate, endDate]);
        
        res.status(200).json({
            success: true,
            data: reports,
            message: 'Lấy danh sách báo cáo nhân viên theo khoảng thời gian thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo nhân viên theo khoảng thời gian:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo nhân viên'
        });
    }
};

/**
 * Lấy báo cáo nhân viên theo nhân viên cụ thể
 */
exports.getStaffReportsByStaffId = async (req, res) => {
    try {
        const { staffId } = req.params;
        
        const query = `
            SELECT bcnv.*, bc.Loai_BC, nv.Ten_NV
            FROM BaoCaoNhanVien bcnv
            JOIN BaoCao bc ON bcnv.ID_BC = bc.ID_BC
            JOIN NhanVien nv ON bcnv.ID_NV = nv.ID_NV
            WHERE bcnv.ID_NV = ?
            ORDER BY bcnv.NgayBaoCao DESC
        `;
        
        const [reports] = await db.query(query, [staffId]);
        
        res.status(200).json({
            success: true,
            data: reports,
            message: 'Lấy danh sách báo cáo nhân viên theo nhân viên thành công'
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo nhân viên theo nhân viên:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo nhân viên'
        });
    }
};

/**
 * Tạo báo cáo hiệu suất tự động dựa trên dữ liệu đơn hàng
 */
exports.generateAutomaticStaffReport = async (req, res) => {
    try {
        const { ID_QL, ID_NV } = req.body;
        
        if (!ID_QL || !ID_NV) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin'
            });
        }
        
        console.log(`Đang tạo báo cáo tự động cho nhân viên ID: ${ID_NV}`);
        
        // Truy vấn thông tin tất cả đơn hàng hoàn thành của nhân viên
        const [orderStats] = await db.connection.query(`
            SELECT 
                COUNT(*) as TongDonHang,
                SUM(CASE WHEN TrangThaiDonHang = 'Đã giao hàng' THEN 1 ELSE 0 END) as DonHoanThanh,
                SUM(CASE WHEN NgayGiaoThucTe > NgayGiaoDuKien AND TrangThaiDonHang = 'Đã giao hàng' THEN 1 ELSE 0 END) as SoDonTre
            FROM DonHang
            WHERE ID_NV = ?
        `, [ID_NV]);
        
        console.log('Kết quả truy vấn đơn hàng:', JSON.stringify(orderStats[0]));
        
        // Lấy tổng số đơn hoàn thành và số đơn trễ, đảm bảo giá trị luôn là số
        const DonHoanThanh = orderStats[0]?.DonHoanThanh ? Number(orderStats[0].DonHoanThanh) : 0;
        const SoDonTre = orderStats[0]?.SoDonTre ? Number(orderStats[0].SoDonTre) : 0;
        
        console.log(`Tổng đơn hoàn thành: ${DonHoanThanh}, Số đơn trễ: ${SoDonTre}`);
        
        // Tính đánh giá hiệu suất
        let DanhGiaHieuSuat = 'Tốt';
        
        if (DonHoanThanh === 0) {
            DanhGiaHieuSuat = 'Không đánh giá';
            console.log('Không có đơn hoàn thành để đánh giá');
        } else {
            const latePct = (SoDonTre / DonHoanThanh) * 100;
            console.log(`Tỷ lệ trễ: ${latePct}%`);
            
            if (latePct > 20) {
                DanhGiaHieuSuat = 'Kém';
            } else if (latePct > 10) {
                DanhGiaHieuSuat = 'Trung bình';
            }
        }
        
        // Bắt đầu giao dịch
        await db.connection.query('START TRANSACTION');
        
        // Tạo bản ghi trong bảng BaoCao
        const [baoCaoResult] = await db.connection.query(
            'INSERT INTO BaoCao (ID_QL, Loai_BC) VALUES (?, ?)',
            [ID_QL, 'Báo cáo nhân viên tự động']
        );
        
        const ID_BC = baoCaoResult.insertId;
        const NgayBaoCao = new Date();
        
        // Tạo bản ghi trong bảng BaoCaoNhanVien
        const [bcnvResult] = await db.connection.query(
            'INSERT INTO BaoCaoNhanVien (ID_BC, ID_NV, NgayBaoCao, SoDonGiao, SoDonTre, DanhGiaHieuSuat) VALUES (?, ?, ?, ?, ?, ?)',
            [ID_BC, ID_NV, NgayBaoCao, DonHoanThanh, SoDonTre, DanhGiaHieuSuat]
        );
        
        // Commit giao dịch
        await db.connection.query('COMMIT');
          res.status(201).json({
            success: true,
            data: {
                ID_BCNV: bcnvResult.insertId,
                ID_BC,
                ID_NV,
                NgayBaoCao,
                SoDonGiao: DonHoanThanh,
                SoDonTre,
                DanhGiaHieuSuat
            },
            message: 'Tạo báo cáo nhân viên tự động thành công'
        });
    } catch (error) {
        // Rollback trong trường hợp lỗi
        await db.connection.query('ROLLBACK');
        
        console.error('Lỗi khi tạo báo cáo nhân viên tự động:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: `Đã xảy ra lỗi khi tạo báo cáo nhân viên tự động: ${error.message}`
        });
    }
};
