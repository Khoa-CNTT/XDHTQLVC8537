const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();
const routerUser = require('./src/routes/routeUser');
const routerHH = require('./src/routes/routeHH');
const routerDH = require('./src/routes/routeDH');
const routerReport = require('./src/routes/routeReport');
const routerPayment = require('./src/routes/routePayment');
const routerNotification = require('./src/routes/routeNotification');
const routeOrder = require('./src/routes/routeOrder');
const routerStaffReport = require('./src/routes/routeStaffReport');
const routerFinancialReport = require('./src/routes/routeFinancialReport');
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  },
  transports: ['websocket', 'polling'] // Hỗ trợ cả WebSocket và polling
});
const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || 'localhost';

// Truyền io object đến global để có thể sử dụng ở bất kỳ file nào
global.io = io;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', routerUser); 
// Protected routes
app.use('/api', authMiddleware, routerHH); // /api/hanghoa, /api/loaihh, etc.
app.use('/api', authMiddleware, routerDH); // /api/donhang
app.use('/api', authMiddleware, routerReport); // /api/reports
app.use('/api', authMiddleware, routerPayment); // /api/payments
app.use('/api', authMiddleware, routerNotification); // /api/notifications
app.use('/api', authMiddleware, routeOrder);
app.use('/api', authMiddleware, routerStaffReport); // /api/staff-reports
app.use('/api', authMiddleware, routerFinancialReport); // /api/financial-reports


// Error handling middleware - should be added after all routes
app.use(errorHandler);

// Khởi tạo kết nối Socket.IO và sử dụng socket handlers từ socketEvents.js
const socketEvents = require('./src/utils/socketEvents');

// Thiết lập socket handlers từ tệp socketEvents
socketEvents.setupSocketHandlers(io);

// Thêm các handlers bổ sung cho socket
io.on('connection', (socket) => {
    console.log('Client connected: ', socket.id);

    // Khi có client kết nối, thông báo cho tất cả clients
    io.emit('serverMessage', {
        type: 'info',
        message: 'Kết nối Socket.IO thành công'
    });
    
    // Đăng ký client vào các phòng theo vai trò (nếu cần)
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
    });
      
    // Xử lý sự kiện khi nhân viên nhận đơn hàng
    socket.on('order:accepted', (data) => {
        console.log(`Đơn hàng ${data.idDH} đã được nhân viên ${data.staffId} nhận vào lúc ${data.time}`);
        
        // Gửi lại thông báo cho tất cả client khác
        io.emit('order:update', {
            ...data,
            message: `Đơn hàng ${data.idDH} đã được nhân viên ${data.staffName || data.staffId} nhận.`
        });
    });
    
    // Xử lý sự kiện khi nhân viên thay đổi trạng thái đơn hàng
    socket.on('order:status_changed', (data) => {
        // Lấy orderCode và time fallback nếu không có
        const orderCode = data.orderCode || data.MaVanDon || data.idDH || data.orderId || 'Không xác định';
        const staffName = data.staffName || data.staffId || 'Nhân viên';
        const oldStatus = data.oldStatus || 'Không xác định';
        const newStatus = data.newStatus || 'Không xác định';
        const time = data.time || data.timestamp || new Date().toLocaleString('vi-VN');
        console.log(`Đơn hàng ${orderCode} đã được nhân viên ${staffName} thay đổi trạng thái từ "${oldStatus}" sang "${newStatus}" vào lúc ${time}`);
        
        // Gửi lại thông báo cho tất cả client khác
        io.emit('order:update', {
            ...data,
            orderCode,
            message: `Đơn hàng ${orderCode} đã được nhân viên ${staffName} thay đổi trạng thái từ "${oldStatus}" sang "${newStatus}" vào lúc ${time}`
        });
    });
    
    // Xử lý sự kiện gửi thông báo đến người dùng cụ thể
    socket.on('send_notification', (data) => {
        console.log('Gửi thông báo tới:', data.to, 'với nội dung:', data.data);
        // Gửi thông báo đến phòng cụ thể
        if (data.to) {
            io.to(data.to).emit('notification', data.data);
        }
    });

    // Xử lý sự kiện khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });
});

// Sử dụng server HTTP thay vì app Express
server.listen(port, hostname, () => {
    console.log(`Server listening with Socket.IO at http://${hostname}:${port}`);
});