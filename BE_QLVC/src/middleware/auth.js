const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Không tìm thấy token xác thực',
                message: 'Bạn cần đăng nhập để truy cập tài nguyên này'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Add user info to request
        req.user = {
            ID_TK: decoded.ID_TK,
            Role: decoded.Role
        };

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token không hợp lệ',
                message: 'Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token đã hết hạn',
                message: 'Phiên đăng nhập của bạn đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        console.error('Auth middleware error:', err);
        res.status(500).json({
            success: false,
            error: 'Lỗi xác thực',
            message: 'Đã xảy ra lỗi trong quá trình xác thực'
        });
    }
};

module.exports = authMiddleware;