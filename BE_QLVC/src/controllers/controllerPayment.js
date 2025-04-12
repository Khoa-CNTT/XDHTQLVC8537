const { connection } = require('../config/database');

// Get all payments
const getAllPayments = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [payments] = await conn.query(`
            SELECT 
                tt.ID_TT, tt.ID_DH, tt.TienHang, tt.TienThuHo,
                dh.MaVanDon, dh.NgayTaoDon, dh.TrangThaiDonHang,
                kh.Ten_KH, nv.Ten_NV
            FROM ThanhToan tt
            JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
            JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
            JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
            ORDER BY tt.ID_TT DESC
        `);

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Implementations for other methods...
const createPayment = async (req, res) => {
    const { ID_DH, TienHang, TienThuHo } = req.body;

    if (!ID_DH || TienHang === undefined || TienThuHo === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if order exists and is delivered
        const [orderCheck] = await conn.query(
            'SELECT TrangThaiDonHang FROM DonHang WHERE ID_DH = ?',
            [ID_DH]
        );

        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (orderCheck[0].TrangThaiDonHang !== 'Delivered') {
            return res.status(400).json({
                success: false,
                error: 'Payment can only be created for delivered orders'
            });
        }

        // Check if payment already exists for this order
        const [paymentCheck] = await conn.query(
            'SELECT ID_TT FROM ThanhToan WHERE ID_DH = ?',
            [ID_DH]
        );

        if (paymentCheck.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Payment already exists for this order'
            });
        }

        // Create payment
        const [result] = await conn.query(
            'INSERT INTO ThanhToan (ID_DH, TienHang, TienThuHo) VALUES (?, ?, ?)',
            [ID_DH, TienHang, TienThuHo]
        );

        await conn.commit();

        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            data: {
                ID_TT: result.insertId,
                ID_DH,
                TienHang,
                TienThuHo
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error creating payment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment'
        });
    } finally {
        if (conn) conn.release();
    }
};

const getPaymentById = async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        const [payments] = await conn.query(`
            SELECT 
                tt.ID_TT, tt.ID_DH, tt.TienHang, tt.TienThuHo,
                dh.MaVanDon, dh.NgayTaoDon, dh.TrangThaiDonHang, dh.PhiGiaoHang,
                kh.Ten_KH, kh.DiaChi as DiaChiKH,
                nv.Ten_NV,
                hh.TenHH, hh.DonGia,
                nn.Ten_NN, nn.DiaChi as DiaChiNN
            FROM ThanhToan tt
            JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
            JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
            JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
            JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
            JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
            WHERE tt.ID_TT = ?
        `, [id]);

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: payments[0]
        });
    } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment'
        });
    } finally {
        if (conn) conn.release();
    }
};

const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { TienHang, TienThuHo } = req.body;

    if (TienHang === undefined && TienThuHo === undefined) {
        return res.status(400).json({
            success: false,
            error: 'No fields to update'
        });
    }

    let conn;
    try {
        conn = await connection.getConnection();

        const updateFields = [];
        const updateValues = [];

        if (TienHang !== undefined) {
            updateFields.push('TienHang = ?');
            updateValues.push(TienHang);
        }

        if (TienThuHo !== undefined) {
            updateFields.push('TienThuHo = ?');
            updateValues.push(TienThuHo);
        }

        updateValues.push(id);

        const [result] = await conn.query(
            `UPDATE ThanhToan SET ${updateFields.join(', ')} WHERE ID_TT = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully'
        });
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update payment'
        });
    } finally {
        if (conn) conn.release();
    }
};

const deletePayment = async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await connection.getConnection();
        const [result] = await conn.query('DELETE FROM ThanhToan WHERE ID_TT = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting payment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to delete payment'
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getAllPayments,
    createPayment,
    getPaymentById,
    updatePayment,
    deletePayment
};
