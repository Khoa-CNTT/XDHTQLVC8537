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

// Get notifications for all orders of a staff
const getNotificationsByStaff = async (req, res) => {
    const { staffId } = req.params;
    let conn;
    try {
        conn = await connection.getConnection();
        // Lấy tất cả thông báo của các đơn hàng mà nhân viên này phụ trách
        const [notifications] = await conn.query(`
            SELECT tb.*
            FROM ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            WHERE dh.ID_NV = ?
            ORDER BY tb.NgayTB DESC
        `, [staffId]);
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching staff notifications:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff notifications'
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

// Đánh dấu tất cả thông báo của nhân viên là đã đọc
const markAllNotificationsAsRead = async (req, res) => {
    const { staffId } = req.params;
    let conn;
    try {
        conn = await connection.getConnection();
        // Cập nhật DaDoc = 1 cho tất cả thông báo của nhân viên này
        await conn.query(`
            UPDATE ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            SET tb.DaDoc = 1
            WHERE dh.ID_NV = ?
        `, [staffId]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
    } finally {
        if (conn) conn.release();
    }
};

// Get notifications for all orders of a user
const getNotificationsByUser = async (req, res) => {
    const { userId } = req.params;
    let conn;
    try {
        conn = await connection.getConnection();
        // Lấy tất cả thông báo của các đơn hàng của người dùng này
        const [notifications] = await conn.query(`
            SELECT tb.*
            FROM ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
            WHERE kh.ID_KH = ?
            ORDER BY tb.NgayTB DESC
        `, [userId]);
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching user notifications:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user notifications'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Mark all notifications as read for a user
const markUserNotificationsAsRead = async (req, res) => {
    const { userId } = req.params;
    let conn;
    try {
        conn = await connection.getConnection();
        // Cập nhật DaDoc = 1 cho tất cả thông báo của người dùng này
        await conn.query(`
            UPDATE ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            SET tb.DaDoc = 1
            WHERE dh.ID_KH = ?
        `, [userId]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error marking user notifications as read:', err);
        res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
    } finally {
        if (conn) conn.release();
    }
};

// Mark a single notification as read
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await connection.getConnection();
        // Update the specific notification to mark as read
        await conn.query('UPDATE ThongBao SET DaDoc = 1 WHERE ID_TB = ?', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
    } finally {
        if (conn) conn.release();
    }
};

// Get all notifications (for admin)
const getAllNotifications = async (req, res) => {
    let conn;
    try {
        conn = await connection.getConnection();
        // Lấy tất cả thông báo trong hệ thống, kết hợp với thông tin đơn hàng
        const [notifications] = await conn.query(`
            SELECT tb.*, dh.MaVanDon
            FROM ThongBao tb
            LEFT JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            ORDER BY tb.NgayTB DESC
        `);
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching all notifications:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get notifications for a staff member since a specific timestamp
const getNotificationsByStaffSince = async (req, res) => {
    const { staffId, timestamp } = req.params;
    const since = new Date(parseInt(timestamp));
    
    let conn;
    try {
        conn = await connection.getConnection();
        // Lấy thông báo kể từ thời điểm được chỉ định
        const [notifications] = await conn.query(`
            SELECT tb.*
            FROM ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            WHERE dh.ID_NV = ? AND tb.NgayTB > ?
            ORDER BY tb.NgayTB DESC
        `, [staffId, since]);
        
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching staff notifications since timestamp:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff notifications'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Get notifications for a user since a specific timestamp
const getNotificationsByUserSince = async (req, res) => {
    const { userId, timestamp } = req.params;
    const since = new Date(parseInt(timestamp));
    
    let conn;
    try {
        conn = await connection.getConnection();
        // Lấy thông báo kể từ thời điểm được chỉ định
        const [notifications] = await conn.query(`
            SELECT tb.*
            FROM ThongBao tb
            JOIN DonHang dh ON tb.ID_DH = dh.ID_DH
            JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
            WHERE kh.ID_KH = ? AND tb.NgayTB > ?
            ORDER BY tb.NgayTB DESC
        `, [userId, since]);
        
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        console.error('Error fetching user notifications since timestamp:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user notifications'
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getNotificationsByOrder,
    getNotificationsByStaff,
    createNotification,
    deleteNotification,
    createOrderStatusNotification,
    markAllNotificationsAsRead,
    // Add new controllers for user notifications
    getNotificationsByUser,
    markUserNotificationsAsRead,
    markNotificationAsRead,
    getAllNotifications,
    // Add new controllers for sync
    getNotificationsByStaffSince,
    getNotificationsByUserSince
};
