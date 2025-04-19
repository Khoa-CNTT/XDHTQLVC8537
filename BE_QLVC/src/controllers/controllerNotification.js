const { connection } = require('../config/database');

// Get notifications for a specific order
const getNotificationsByOrder = async (req, res) => {
    const { idDH } = req.params;
    
    let conn;
    try {
        conn = await connection.getConnection();
        const [notifications] = await conn.query(`
            SELECT * FROM ThongBao
            WHERE ID_DH = ?
            ORDER BY NgayTB DESC
        `, [idDH]);
        
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Create a new notification
const createNotification = async (req, res) => {
    const { ID_DH, NoiDung } = req.body;
    
    if (!ID_DH || !NoiDung) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }
    
    let conn;
    try {
        conn = await connection.getConnection();
        
        // Check if order exists
        const [orderCheck] = await conn.query('SELECT ID_DH FROM DonHang WHERE ID_DH = ?', [ID_DH]);
        
        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        const [result] = await conn.query(
            'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB) VALUES (?, ?, NOW())',
            [ID_DH, NoiDung]
        );
        
        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: {
                ID_TB: result.insertId,
                ID_DH,
                NoiDung,
                NgayTB: new Date()
            }
        });
    } catch (err) {
        console.error('Error creating notification:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to create notification'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Create order status change notification
const createOrderStatusNotification = async (orderId, status) => {
    let conn;
    try {
        conn = await connection.getConnection();
        
        let message = '';
        switch (status) {
            case 'Pending':
                message = 'Đơn hàng của bạn đã được tạo thành công và đang chờ xử lý.';
                break;
            case 'Delivered':
                message = 'Đơn hàng của bạn đã được giao thành công.';
                break;
            case 'Cancelled':
                message = 'Đơn hàng của bạn đã bị hủy.';
                break;
            default:
                message = `Trạng thái đơn hàng của bạn đã được cập nhật thành: ${status}`;
        }
        
        await conn.query(
            'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB) VALUES (?, ?, NOW())',
            [orderId, message]
        );
        
        return true;
    } catch (err) {
        console.error('Error creating status notification:', err);
        return false;
    } finally {
        if (conn) conn.release();
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    const { id } = req.params;
    
    let conn;
    try {
        conn = await connection.getConnection();
        const [result] = await conn.query('DELETE FROM ThongBao WHERE ID_TB = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getNotificationsByOrder,
    createNotification,
    createOrderStatusNotification,
    deleteNotification
};
