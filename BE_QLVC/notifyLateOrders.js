// notifyLateOrders.js
const { connection } = require('./src/config/database');
const { generateLateDeliveryMessageHF } = require('./src/utils/huggingFaceNotify');

/**
 * Gửi thông báo chúc mừng cho nhân viên khi không có đơn hàng trễ
 * @param {Object} conn - Database connection
 */
async function sendCongratulationMessage(conn) {
  if (!global?.io?.emit) return;
  
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('vi-VN');
  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][currentDate.getDay()];

  // Truy vấn để lấy tổng số đơn hàng đang vận chuyển hôm nay
  const [activeOrders] = await conn.query(`
    SELECT COUNT(*) AS total FROM DonHang
    WHERE TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại') 
    AND DATE(NgayTaoDon) = CURDATE()
  `);
  
  const totalActiveOrders = activeOrders[0]?.total || 0;
  
  const congratMessage = `[CHÚC MỪNG 🎉] ${dayOfWeek}, ngày ${formattedDate} không có đơn hàng nào bị trễ!

🏆 Đội ngũ giao hàng đã làm việc rất hiệu quả với ${totalActiveOrders} đơn hàng đang được xử lý đúng tiến độ.

👏 Xin chúc mừng và cảm ơn sự nỗ lực của tất cả nhân viên.
    
💪 Hãy tiếp tục duy trì phong độ tuyệt vời này! Đây là một thành tích đáng tự hào và là minh chứng cho sự chuyên nghiệp của toàn đội.`;
  
  // Lưu thông báo chúc mừng vào database
  try {
    // Lấy một đơn hàng bất kỳ đang hoạt động để liên kết (hoặc null nếu không có)
    const [anyOrder] = await conn.query(`
      SELECT ID_DH FROM DonHang 
      WHERE TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
      LIMIT 1
    `);
    
    const orderId = anyOrder.length > 0 ? anyOrder[0].ID_DH : null;
    
    if (orderId) {
      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB, LoaiThongBao) VALUES (?, ?, NOW(), ?)',
        [orderId, congratMessage, 'chuc_mung']
      );
    }
  } catch (err) {
    console.error('Không thể lưu thông báo chúc mừng vào database:', err);
  }
  
  // Gửi thông báo cho tất cả nhân viên qua kênh 'staff'
  global.io.to('staff').emit('notification:new', {
    message: congratMessage,
    type: 'congratulation',
    forStaff: true,
    priority: 'success',
    timestamp: new Date().toISOString(),
    title: 'Không có đơn hàng trễ hẹn hôm nay!',
    icon: '🏆'
  });
  
  console.log('Đã gửi thông báo chúc mừng cho nhân viên (không có đơn hàng trễ)');
}

async function handleLateOrders(conn) {
  const [orders] = await conn.query(`
    SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN,
           dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien, dh.ID_KH
    FROM DonHang dh
    JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
    JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
    WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
      AND dh.NgayGiaoDuKien IS NOT NULL
      AND NOW() > dh.NgayGiaoDuKien
      AND NOT EXISTS (
        SELECT 1 FROM ThongBao tb WHERE tb.ID_DH = dh.ID_DH AND tb.NoiDung LIKE '%giao trễ%'
      )
  `);

  console.log(`Số đơn hàng cần thông báo trễ: ${orders.length}`);
  if (orders.length === 0) return;

  for (const order of orders) {
    try {
      let message = await generateLateDeliveryMessageHF(order);
      if (!message || !message.trim()) {
        message = `Đơn hàng ${order.MaVanDon} đã bị giao trễ.`;
      }      console.log('Nội dung AI gửi:', message);
      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB) VALUES (?, ?, NOW())',
        [order.ID_DH, message]
      );      if (global?.io?.emit) {
        // Tạo thông báo riêng cho nhân viên, chi tiết và chuyên nghiệp hơn
        const staffMessage = `[YÊU CẦU XỬ LÝ] Đơn hàng ${order.MaVanDon} đã bị trễ hạn giao. 
Khách hàng: ${order.TenKhachHang || 'Không xác định'}
Địa chỉ: ${order.DiaChiNN || 'Không xác định'}
Ngày tạo đơn: ${new Date(order.NgayTaoDon).toLocaleDateString('vi-VN')}
Ngày dự kiến giao: ${new Date(order.NgayGiaoDuKien).toLocaleDateString('vi-VN')}
Vui lòng kiểm tra và xử lý gấp.`;

        // Gửi thông báo cho nhân viên (staff room)
        global.io.to('staff').emit('notification:new', { 
          orderId: order.ID_DH, 
          message: staffMessage,
          type: 'late_delivery',
          forStaff: true,
          priority: 'high'
        });
        
        // Gửi thông báo cho khách hàng cụ thể
        if (order.ID_KH) {
          global.io.to(`customer_${order.ID_KH}`).emit('notification:new', { 
            orderId: order.ID_DH, 
            message,
            type: 'late_delivery' 
          });
        }
      }

      console.log(`Đã gửi thông báo trễ cho đơn hàng ${order.MaVanDon}`);
    } catch (err) {
      console.error('OpenAI hoặc DB error:', err);
    }
  }
}

async function handleUpcomingOrders(conn) {
  const [orders] = await conn.query(`
    SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN,
           dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien, dh.ID_KH
    FROM DonHang dh
    JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
    JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
    WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
      AND dh.NgayGiaoDuKien IS NOT NULL
      AND dh.NgayGiaoDuKien > NOW()
      AND dh.NgayGiaoDuKien <= DATE_ADD(NOW(), INTERVAL 1 DAY)
      AND NOT EXISTS (
        SELECT 1 FROM ThongBao tb WHERE tb.ID_DH = dh.ID_DH AND tb.NoiDung LIKE '%sắp đến hạn giao%'
      )
  `);

  console.log(`Số đơn hàng sắp đến hạn giao: ${orders.length}`);
  if (orders.length === 0) return;

  for (const order of orders) {    try {      const message = `Đơn hàng ${order.MaVanDon} sắp đến hạn giao.`;

      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB, LoaiThongBao) VALUES (?, ?, NOW(), ?)',
        [order.ID_DH, message, 'upcoming_delivery']
      );      if (global?.io?.emit) {
        // Tạo thông báo cho nhân viên về đơn hàng sắp đến hạn giao
        const staffMessage = `[NHẮC NHỞ] Đơn hàng ${order.MaVanDon} sắp đến hạn giao.
Khách hàng: ${order.TenKhachHang || 'Không xác định'}
Địa chỉ: ${order.DiaChiNN || 'Không xác định'}
Ngày tạo đơn: ${new Date(order.NgayTaoDon).toLocaleDateString('vi-VN')}
Ngày dự kiến giao: ${new Date(order.NgayGiaoDuKien).toLocaleDateString('vi-VN')}
Vui lòng chuẩn bị giao hàng đúng hạn.`;

        // Gửi thông báo cho nhân viên (staff room)
        global.io.to('staff').emit('notification:new', { 
          orderId: order.ID_DH, 
          message: staffMessage,
          type: 'upcoming_delivery',
          forStaff: true,
          priority: 'medium'
        });
        
        // Gửi thông báo cho khách hàng cụ thể
        if (order.ID_KH) {
          global.io.to(`customer_${order.ID_KH}`).emit('notification:new', { 
            orderId: order.ID_DH, 
            message,
            type: 'upcoming_delivery' 
          });
        }
      }

      console.log(`Đã gửi thông báo sắp đến hạn giao cho đơn hàng ${order.MaVanDon}`);
    } catch (err) {
      console.error('DB error (upcoming):', err);
    }
  }
}

async function notifyLateOrders() {
  const conn = await connection.getConnection();
  try {
    await handleLateOrders(conn);
    await handleUpcomingOrders(conn);
    // Gửi thông báo chúc mừng nếu không có đơn hàng trễ
    const [lateOrders] = await conn.query(`
      SELECT 1 FROM DonHang dh
      WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
        AND dh.NgayGiaoDuKien IS NOT NULL
        AND NOW() > dh.NgayGiaoDuKien
    `);
    
    if (lateOrders.length === 0) {
      await sendCongratulationMessage(conn);
    }
  } catch (err) {
    console.error('DB error:', err);
  } finally {
    conn.release();
  }
}

// Chạy script
notifyLateOrders().then(() => process.exit(0));
