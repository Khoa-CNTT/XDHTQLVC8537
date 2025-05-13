// notifyLateOrders.js
const { connection } = require('./src/config/database');
const { generateLateDeliveryMessageHF } = require('./src/utils/huggingFaceNotify');
const { formatDateVN, toMySQLTimestamp, nowWithTimezone } = require('./src/utils/dateUtils');

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
    AND DATE(NgayTaoDon) = DATE(${nowWithTimezone()})
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
      // Sử dụng timestamp hiện tại với múi giờ Việt Nam
      const currentTime = new Date();
      const formattedTimestamp = toMySQLTimestamp(currentTime);
      
      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB, LoaiThongBao) VALUES (?, ?, ?, ?)',
        [orderId, congratMessage, formattedTimestamp, 'chuc_mung']
      );
    }
  } catch (err) {
    console.error('Không thể lưu thông báo chúc mừng vào database:', err);
  }
    // Gửi thông báo cho tất cả nhân viên qua kênh 'staff'
  // Sử dụng thời gian đã định dạng đúng múi giờ Việt Nam
  const vnTimestamp = new Date().toISOString(); // Socket sẽ tự hiển thị theo múi giờ máy khách
  
  global.io.to('staff').emit('notification:new', {
    message: congratMessage,
    type: 'congratulation',
    forStaff: true,
    priority: 'success',
    timestamp: vnTimestamp,
    title: 'Không có đơn hàng trễ hẹn hôm nay!',
    icon: '🏆'
  });
  
  console.log('Đã gửi thông báo chúc mừng cho nhân viên (không có đơn hàng trễ)');
}

async function handleLateOrders(conn) {
  // Thêm log để theo dõi quá trình kiểm tra đơn hàng trễ
  console.log('--- BẮT ĐẦU KIỂM TRA ĐƠN HÀNG TRỄ ---');
  // Thay đổi truy vấn để thêm nhãn thời gian vào câu điều kiện NOT EXISTS và sử dụng hàm hỗ trợ múi giờ
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // Lấy YYYY-MM-DD
    const [orders] = await conn.query(`
    SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN,
           dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien, dh.ID_KH
    FROM DonHang dh
    JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
    JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
    WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
      AND dh.NgayGiaoDuKien IS NOT NULL
      AND ${nowWithTimezone()} > dh.NgayGiaoDuKien
      AND NOT EXISTS (
        SELECT 1 FROM ThongBao tb 
        WHERE tb.ID_DH = dh.ID_DH 
        AND tb.NoiDung LIKE '%giao trễ%' 
        AND DATE(tb.NgayTB) = ?
      )
  `, [todayStr]);

  console.log(`Số đơn hàng cần thông báo trễ: ${orders.length}`);
  if (orders.length === 0) {
    console.log('Không có đơn hàng trễ hạn giao cần thông báo.');
    return;
  }

  // Thêm một thông báo tổng hợp cho nhân viên
  if (global?.io?.emit && orders.length > 0) {    const lateOrdersList = orders.map(order => 
      `- Mã vận đơn: ${order.MaVanDon}, Khách hàng: ${order.TenKhachHang}, Ngày giao dự kiến: ${formatDateSafely(readDateSafely(order.NgayGiaoDuKien))}`).join('\n');
    
    const staffSummaryMessage = `[CẢNH BÁO ⚠️] Phát hiện ${orders.length} đơn hàng đã trễ hạn giao cần xử lý gấp:

${lateOrdersList}

👉 Yêu cầu nhân viên phụ trách kiểm tra và liên hệ với khách hàng ngay lập tức.
👉 Báo cáo tình trạng cho quản lý và cập nhật trạng thái đơn hàng khi có tiến triển mới.`;    // Gửi thông báo tổng hợp cho phòng nhân viên
    // Sử dụng thời gian ISO chuẩn, client sẽ hiển thị theo múi giờ local
    const vnTimestamp = new Date().toISOString();
    
    global.io.to('staff').emit('notification:new', {
      message: staffSummaryMessage,
      type: 'late_orders_summary',
      forStaff: true,
      priority: 'high',
      title: `[KHẨN] ${orders.length} đơn hàng đã trễ hạn giao`,
      icon: '⚠️',
      timestamp: vnTimestamp
    });
    
    console.log('Đã gửi thông báo tổng hợp về đơn hàng trễ cho nhân viên');
  }

  for (const order of orders) {
    try {
      let message = await generateLateDeliveryMessageHF(order);
      if (!message || !message.trim()) {
        message = `Đơn hàng ${order.MaVanDon} đã bị giao trễ.`;
      }
        console.log('Nội dung AI gửi:', message);
        // Sử dụng timestamp hiện tại với múi giờ Việt Nam
      const currentTime = new Date();
      const formattedTimestamp = toMySQLTimestamp(currentTime);
      
      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB, LoaiThongBao) VALUES (?, ?, ?, ?)',
        [order.ID_DH, message, formattedTimestamp, 'late_delivery']
      );
      
      if (global?.io?.emit) {        // Tạo thông báo ngắn gọn cho nhân viên
        const staffMessage = `[YÊU CẦU XỬ LÝ] Đơn hàng ${order.MaVanDon} trễ hẹn.
KH: ${order.TenKhachHang || 'N/A'} - Ngày giao dự kiến: ${new Date(order.NgayGiaoDuKien).toLocaleDateString('vi-VN')}
Vui lòng xử lý gấp.`;

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
  console.log('--- KẾT THÚC KIỂM TRA ĐƠN HÀNG TRỄ ---');
}

async function handleUpcomingOrders(conn) {
  // Thêm log để theo dõi quá trình kiểm tra đơn hàng sắp đến hạn
  console.log('--- BẮT ĐẦU KIỂM TRA ĐƠN HÀNG SẮP ĐẾN HẠN ---');
  const [orders] = await conn.query(`
    SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN,
           dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien, dh.ID_KH
    FROM DonHang dh
    JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
    JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
    WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
      AND dh.NgayGiaoDuKien IS NOT NULL
      AND dh.NgayGiaoDuKien > ${nowWithTimezone()}
      AND dh.NgayGiaoDuKien <= DATE_ADD(${nowWithTimezone()}, INTERVAL 1 DAY)
      AND NOT EXISTS (
        SELECT 1 FROM ThongBao tb 
        WHERE tb.ID_DH = dh.ID_DH 
        AND tb.NoiDung LIKE '%sắp đến hạn giao%' 
        AND DATE(tb.NgayTB) = DATE(${nowWithTimezone()})
      )
  `);

  console.log(`Số đơn hàng sắp đến hạn giao: ${orders.length}`);
  if (orders.length === 0) {
    console.log('Không có đơn hàng sắp đến hạn giao cần thông báo.');
    return;
  }

  // Thêm thông báo tổng hợp cho nhân viên về đơn hàng sắp đến hạn
  if (global?.io?.emit && orders.length > 0) {    const upcomingOrdersList = orders.map(order => 
      `- Mã vận đơn: ${order.MaVanDon}, Khách hàng: ${order.TenKhachHang}, Ngày giao dự kiến: ${formatDateSafely(readDateSafely(order.NgayGiaoDuKien))}`).join('\n');
    
    const staffSummaryMessage = `[NHẮC NHỞ 📅] Có ${orders.length} đơn hàng sẽ đến hạn giao trong vòng 24 giờ tới:

${upcomingOrdersList}

👉 Nhân viên cần kiểm tra trạng thái đơn hàng và chuẩn bị giao hàng đúng hạn.
👉 Nếu có khó khăn trong việc giao hàng đúng hẹn, vui lòng thông báo cho quản lý ngay lập tức.`;

    // Gửi thông báo tổng hợp cho phòng nhân viên
    global.io.to('staff').emit('notification:new', {
      message: staffSummaryMessage,
      type: 'upcoming_orders_summary',
      forStaff: true,
      priority: 'medium',
      title: `[NHẮC NHỞ] ${orders.length} đơn hàng sắp đến hạn giao`,
      icon: '📅',
      timestamp: new Date().toISOString()
    });
    
    console.log('Đã gửi thông báo tổng hợp về đơn hàng sắp đến hạn cho nhân viên');
  }

  for (const order of orders) {
    try {      const message = `Đơn hàng ${order.MaVanDon} sắp đến hạn giao.`;

      // Sử dụng timestamp hiện tại với múi giờ Việt Nam
      const currentTime = new Date();
      const formattedTimestamp = toMySQLTimestamp(currentTime);

      await conn.query(
        'INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB, LoaiThongBao) VALUES (?, ?, ?, ?)',        
        [order.ID_DH, message, formattedTimestamp, 'upcoming_delivery']
      );
      
      if (global?.io?.emit) {
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
  console.log('--- KẾT THÚC KIỂM TRA ĐƠN HÀNG SẮP ĐẾN HẠN ---');
}

/**
 * Helper function to safely format a date without modifying the original date
 * @param {Date} dateObj - The date object to format 
 * @returns {string} - Formatted date string
 */
function formatDateSafely(dateObj) {
  if (!dateObj) return 'Chưa có';
  
  try {
    // Create a new date object to avoid modifying the original
    const safeDate = new Date(dateObj.getTime());
    
    // Format using toLocaleDateString without modifying the date
    return safeDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return String(dateObj);
  }
}

/**
 * Helper function to ensure we read dates from DB without modifying them
 * @param {Date} dbDate - Date from database
 * @returns {Date} - Safely handled date
 */
function readDateSafely(dbDate) {
  if (!dbDate) return null;
  
  // Return a new date object to avoid direct references
  return new Date(dbDate);
}

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
    await handleUpcomingOrders(conn);    // Gửi thông báo chúc mừng nếu không có đơn hàng trễ
    const [lateOrders] = await conn.query(`
      SELECT 1 FROM DonHang dh
      WHERE dh.TrangThaiDonHang NOT IN ('Đã giao', 'Huỷ giao', 'Giao thất bại')
        AND dh.NgayGiaoDuKien IS NOT NULL
        AND ${nowWithTimezone()} > dh.NgayGiaoDuKien
    `);
    
    // Kiểm tra xem đã gửi thông báo chúc mừng hôm nay chưa
    const [todayCongrats] = await conn.query(`
      SELECT 1 FROM ThongBao
      WHERE LoaiThongBao = 'chuc_mung'
      AND DATE(NgayTB) = DATE(${nowWithTimezone()})
    `);
    
    // Chỉ gửi thông báo chúc mừng nếu không có đơn hàng trễ và chưa gửi thông báo hôm nay
    if (lateOrders.length === 0 && todayCongrats.length === 0) {
      await sendCongratulationMessage(conn);
    } else if (lateOrders.length === 0) {
      console.log('Không có đơn hàng trễ nhưng đã gửi thông báo chúc mừng hôm nay');
    } else {
      console.log(`Có ${lateOrders.length} đơn hàng trễ, không gửi thông báo chúc mừng`);
    }
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    conn.release();
  }
}

// Chạy script
notifyLateOrders().then(() => process.exit(0));
