// notifyLateOrders.js
const { connection } = require("./src/config/database");
const {
  generateLateDeliveryMessageHF,
} = require("./src/utils/huggingFaceNotify");

async function notifyLateOrders() {
  const conn = await connection.getConnection();
  try {
    // Lấy các đơn hàng chưa giao, đã quá ngày dự kiến giao hàng và chưa có thông báo trễ
    const [orders] = await conn.query(`
      SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN, dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien
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
    if (orders.length === 0) {
      console.log("Không có đơn hàng nào cần thông báo trễ.");
    }
    for (const order of orders) {
      try {
        let message = await generateLateDeliveryMessageHF(order);
        // Nếu message rỗng, gán nội dung mặc định
        if (!message || !message.trim()) {
          message = `Đơn hàng ${order.MaVanDon} đã bị giao trễ.`;
        }
        // Log nội dung message AI trả về
        console.log("Nội dung AI gửi:", message);
        await conn.query(
          "INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB) VALUES (?, ?, NOW())",
          [order.ID_DH, message]
        );
        // Gửi socket nếu muốn (nếu có global.io)
        if (global.io) {
          global.io.emit("notification:new", { orderId: order.ID_DH, message });
        }
        console.log(`Đã gửi thông báo trễ cho đơn hàng ${order.MaVanDon}`);
      } catch (err) {
        console.error("OpenAI hoặc DB error:", err);
      }
    }

    // Thông báo đơn hàng sắp đến ngày giao hàng dự kiến (trước 1 ngày)
    const [upcomingOrders] = await conn.query(`
      SELECT dh.ID_DH, dh.MaVanDon, kh.Ten_KH AS TenKhachHang, nn.DiaChi AS DiaChiNN, dh.NgayTaoDon, dh.TrangThaiDonHang, dh.NgayGiaoDuKien
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
    console.log(`Số đơn hàng sắp đến hạn giao: ${upcomingOrders.length}`);
    for (const order of upcomingOrders) {
      try {
        let message = `Đơn hàng ${order.MaVanDon} sắp đến hạn giao.`;
        await conn.query(
          "INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB) VALUES (?, ?, NOW())",
          [order.ID_DH, message]
        );
        if (global.io) {
          global.io.emit("notification:new", { orderId: order.ID_DH, message });
        }
        console.log(
          `Đã gửi thông báo sắp đến hạn giao cho đơn hàng ${order.MaVanDon}`
        );
      } catch (err) {
        console.error("DB error (upcoming):", err);
      }
    }
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    conn.release();
  }
}

// Chạy script
notifyLateOrders().then(() => process.exit(0));
