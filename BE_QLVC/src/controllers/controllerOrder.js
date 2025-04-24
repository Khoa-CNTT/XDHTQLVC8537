const { connection } = require('../config/database');
const { executeQuery } = require('../utils/dbUtils');
const socketEvents = require('../utils/socketEvents');

/**
 * Get all orders with optional filtering
 */
exports.getOrders = async (req, res, next) => {
  try {
    const { 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      customerId,
      employeeId,
      cod
    } = req.query;

    // Base query with joins to get all necessary information
    let query = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        kh.ID_KH,
        kh.Ten_KH AS TenKhachHang,
        kh.DiaChi AS DiaChiKH,
        tk_kh.SDT AS SDT_KH,
        nv.ID_NV,
        nv.Ten_NV AS TenNhanVien,
        nn.ID_NN,
        nn.Ten_NN AS TenNguoiNhan,
        nn.DiaChi AS DiaChiNN,
        nn.SDT AS SdtNguoiNhan,
        hh.ID_HH,
        hh.TenHH,
        hh.SoLuong,
        hh.TrongLuong,
        tt.Tienship,
        tt.TienThuHo
      FROM DonHang dh
      JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      JOIN TaiKhoan tk_kh ON kh.ID_TK = tk_kh.ID_TK
      JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      LEFT JOIN ThanhToan tt ON dh.ID_DH = tt.ID_DH
      WHERE 1=1
    `;

    // Add filters if provided
    if (status) {
      query += ` AND dh.TrangThaiDonHang = '${status}'`;
    }

    if (customerId) {
      query += ` AND dh.ID_KH = ${customerId}`;
    }

    if (employeeId) {
      query += ` AND dh.ID_NV = ${employeeId}`;
    }

    if (startDate && endDate) {
      query += ` AND dh.NgayTaoDon BETWEEN '${startDate}' AND '${endDate}'`;
    }

    // Filter by COD status
    if (paymentStatus === 'noCOD') {
      query += ` AND (tt.TienThuHo = 0 OR tt.TienThuHo IS NULL)`;
    } else if (paymentStatus === 'waitingCOD') {
      query += ` AND tt.TienThuHo > 0 AND dh.TrangThaiDonHang != 'Đã giao'`;
    } else if (paymentStatus === 'receivedCOD') {
      query += ` AND tt.TienThuHo > 0 AND dh.TrangThaiDonHang = 'Đã giao'`;
    }

    if (cod) {
      if (cod === 'hasValue') {
        query += ` AND tt.TienThuHo > 0`;
      }
    }

    // Execute query
    const orders = await executeQuery(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        dh.ID_DH,
        dh.MaVanDon,
        dh.NgayTaoDon,
        dh.NgayGiaoDuKien,
        dh.NgayGiaoThucTe,
        dh.TrangThaiDonHang,
        dh.PhiGiaoHang,
        dh.GhiChu,
        kh.ID_KH,
        kh.Ten_KH AS TenKhachHang,
        kh.DiaChi AS DiaChiKH,
        tk_kh.Email AS EmailKH,
        tk_kh.SDT AS SdtKhachHang,
        nv.ID_NV,
        nv.Ten_NV AS TenNhanVien,
        nn.ID_NN,
        nn.Ten_NN AS TenNguoiNhan,
        nn.DiaChi AS DiaChiNN,
        nn.SDT AS SdtNguoiNhan,        
        hh.ID_HH,
        hh.TenHH,
        hh.SoLuong,
        hh.TrongLuong,
        lhh.TenLoaiHH,
        tchh.TenTCHH,
        tt.Tienship,
        tt.TienThuHo
      FROM DonHang dh
      JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH
      JOIN TaiKhoan tk_kh ON kh.ID_TK = tk_kh.ID_TK
      JOIN NhanVien nv ON dh.ID_NV = nv.ID_NV
      JOIN NguoiNhan nn ON dh.ID_NN = nn.ID_NN
      JOIN HangHoa hh ON dh.ID_HH = hh.ID_HH
      JOIN LoaiHH lhh ON hh.ID_LHH = lhh.ID_LHH
      JOIN TinhChatHH tchh ON hh.ID_TCHH = tchh.ID_TCHH
      LEFT JOIN ThanhToan tt ON dh.ID_DH = tt.ID_DH
      WHERE dh.ID_DH = ?
    `;

    const [order] = await executeQuery(query, [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      const {
        khachHangId,        nhanVienId,
        hangHoa,
        hangHoaId,
        nguoiNhan,
        phiGiaoHang,
        tienShip,
        tienThuHo,
        ghiChu
      } = req.body;
      
      // Xử lý trường hợp gửi hangHoa thay vì hangHoaId
      let finalHangHoaId = hangHoaId;
      
      // Nếu không có hangHoaId nhưng có hangHoa, tạo mới hàng hóa
      if (!finalHangHoaId && hangHoa) {
        try {
          // Lấy ID_LHH từ request. Nếu có thuộc tính ID_LHH, sử dụng nó
          let loaiHHId = hangHoa.ID_LHH || hangHoa.loaiHH || 1;
          
          // Lấy ID_TCHH từ request. Nếu có thuộc tính ID_TCHH, sử dụng nó
          let tinhChatHHId = hangHoa.ID_TCHH || 1; // Sử dụng ID_TCHH từ request nếu có
              // Tạo mới hàng hóa - đảm bảo lưu đầy đủ tính chất hàng hóa, hình ảnh và loại hàng hóa
          const insertHHQuery = `
            INSERT INTO HangHoa (TenHH, SoLuong, TrongLuong, ID_LHH, ID_TCHH, image)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          // Kiểm tra ảnh sản phẩm
          let productImage = 'default.jpg';
          if (hangHoa.image && typeof hangHoa.image === 'string' && hangHoa.image.trim() !== '') {
            productImage = hangHoa.image;
          }      const [hhResult] = await conn.execute(
            insertHHQuery,
            [
              hangHoa.tenHH,
              parseInt(hangHoa.soLuong) || 1, // Đảm bảo số lượng luôn là số nguyên
              hangHoa.trongLuong || 0.1,
              loaiHHId, // Loại hàng hóa
              tinhChatHHId, // Tính chất hàng hóa
              productImage // Ảnh sản phẩm
            ]
          );
          
          finalHangHoaId = hhResult.insertId;
        } catch (error) {
          console.error('Error creating product:', error);
          throw new Error('Không thể tạo mới hàng hóa');
        }
      }
      
      // Xử lý nhanVienId - nếu không có, gán mặc định là 1 (có thể thay đổi sau)
      const finalNhanVienId = nhanVienId || 1; // ID của nhân viên mặc định
      // Generate unique shipping code (MaVanDon)
      const maVanDon = generateShippingCode();

      // First, check if we need to create a new recipient
      let nguoiNhanId;
      if (nguoiNhan.id) {
        // Use existing recipient
        nguoiNhanId = nguoiNhan.id;
      } else {
        // Create new recipient
        const insertNNQuery = `
          INSERT INTO NguoiNhan (Ten_NN, DiaChi, SDT)
          VALUES (?, ?, ?)
        `;
          const [nnResult] = await conn.execute(
          insertNNQuery, 
          [nguoiNhan.ten, nguoiNhan.diaChi, nguoiNhan.sdt]
        );
        
        nguoiNhanId = nnResult.insertId;
      }      // Create the order in temporary table
      const ngayTaoDon = new Date();
      // Calculate expected delivery date (e.g., 3 days from now)
      const ngayGiaoDuKien = new Date(ngayTaoDon);
      ngayGiaoDuKien.setDate(ngayGiaoDuKien.getDate() + 3);
      
      // Insert into DonHangTam instead of DonHang
      const insertOrderQuery = `
        INSERT INTO DonHangTam (
          ID_KH, ID_HH, ID_NN, MaVanDon, 
          NgayTaoDon, NgayGiaoDuKien, TrangThaiDonHang, PhiGiaoHang, GhiChu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;      const [orderResult] = await conn.execute(
        insertOrderQuery,
        [
          khachHangId, 
          finalHangHoaId, 
          nguoiNhanId, 
          maVanDon,
          ngayTaoDon,
          ngayGiaoDuKien,
          'Đang chờ xử lý', // Luôn sử dụng trạng thái "Đang chờ xử lý" cho đơn hàng tạm
          phiGiaoHang,
          ghiChu || null
        ]
      );

      const orderId = orderResult.insertId;      // Create temporary payment record
      const insertPaymentQuery = `
        INSERT INTO ThanhToanTam (ID_DHT, TienShip, TienThuHo)
        VALUES (?, ?, ?)
      `;      await conn.execute(
        insertPaymentQuery,
        [orderId, tienShip, tienThuHo || 0]
      );

      // Create notification for temporary order
      const insertNotificationQuery = `
        INSERT INTO ThongBaoTam (ID_DHT, NoiDung, NgayTB)
        VALUES (?, ?, ?)
      `;      await conn.execute(
        insertNotificationQuery,
        [
          orderId,
          'Đơn hàng mới đã được tạo và đang chờ nhân viên xác nhận',
          new Date()
        ]
      );      await conn.commit();

      const orderData = {
        id: orderId,
        maVanDon,
        khachHangId,
        status: 'pending'
      };
      
      // Thông báo có đơn hàng mới qua socket
      socketEvents.emitNewOrder(orderData);

      res.status(201).json({
        success: true,
        message: 'Đơn hàng đã được tạo thành công và đang chờ nhân viên xác nhận',
        data: orderData
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status is one of the allowed values
    const validStatuses = [
      'Đã tiếp nhận',
      'Đang lấy',
      'Đã lấy',
      'Lấy thất bại',
      'Đang vận chuyển',
      'Đang giao',
      'Đã giao',
      'Giao thất bại',
      'Quá hạn giao',
      'Huỷ giao',
      'Đã Hoàn',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Update order status
      const updateQuery = `
        UPDATE DonHang
        SET TrangThaiDonHang = ?
        WHERE ID_DH = ?
      `;

      const [result] = await conn.execute(updateQuery, [status, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      // If status is "Đã giao" (delivered), update the actual delivery date
      if (status === 'Đã giao') {
        const updateDeliveryDateQuery = `
          UPDATE DonHang
          SET NgayGiaoThucTe = ?
          WHERE ID_DH = ?
        `;
        await conn.execute(updateDeliveryDateQuery, [new Date(), id]);
      }

      // --- OPENAI: Nếu trạng thái là Quá hạn giao, sinh thông báo AI ---
      let notificationContent = `Đơn hàng đã được cập nhật trạng thái: ${status}`;
      if (status === 'Quá hạn giao') {
        // Lấy thông tin đơn hàng để truyền cho AI
        const [orders] = await conn.execute('SELECT MaVanDon, Ten_KH AS TenKhachHang, DiaChi AS DiaChiNN FROM DonHang dh JOIN KhachHang kh ON dh.ID_KH = kh.ID_KH WHERE dh.ID_DH = ?', [id]);
        const orderInfo = orders[0] || { ID_DH: id };
        try {
          notificationContent = await generateLateDeliveryMessage(orderInfo);
        } catch (aiErr) {
          console.error('OpenAI error:', aiErr);
          notificationContent = `Đơn hàng ${orderInfo.MaVanDon || id} đã bị giao trễ.`;
        }
      }
      // --- END OPENAI ---

      const insertNotificationQuery = `
        INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB)
        VALUES (?, ?, ?)
      `;

      await conn.execute(
        insertNotificationQuery,
        [id, notificationContent, new Date()]
      );

      await conn.commit();

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an order - progresses to the next status
 */
exports.approveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First get the current status
    const getStatusQuery = `
      SELECT TrangThaiDonHang FROM DonHang WHERE ID_DH = ?
    `;

    const [orderStatus] = await executeQuery(getStatusQuery, [id]);

    if (!orderStatus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }    // Define status progression
    const statusProgression = {
      'Đang chờ xử lý': 'Đã nhận hàng', // Không cần thiết vì đã có endpoint acceptOrder riêng
      'Đã nhận hàng': 'Đang lấy',
      'Đang lấy': 'Đã lấy',
      'Đã lấy': 'Đang vận chuyển',
      'Đang vận chuyển': 'Đang giao',
      'Đang giao': 'Đã giao',
      'Giao thất bại': 'Đang giao' // Try delivery again
    };

    const currentStatus = orderStatus.TrangThaiDonHang;
    const nextStatus = statusProgression[currentStatus];

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: 'Không thể duyệt đơn hàng ở trạng thái hiện tại'
      });
    }

    // Update to next status
    req.body = { status: nextStatus };
    // Call the updateOrderStatus function directly instead of using 'this'
    return exports.updateOrderStatus(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    // Check if the order is in a state that can be cancelled
    const getStatusQuery = `
      SELECT TrangThaiDonHang FROM DonHang WHERE ID_DH = ?
    `;

    const [orderStatus] = await executeQuery(getStatusQuery, [id]);

    if (!orderStatus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // List of statuses that cannot be cancelled
    const nonCancellableStatuses = ['Đã giao', 'Huỷ giao', 'Đã Hoàn'];

    if (nonCancellableStatuses.includes(orderStatus.TrangThaiDonHang)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể huỷ đơn hàng ở trạng thái hiện tại'
      });
    }

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Update order status to cancelled
      const updateQuery = `
        UPDATE DonHang
        SET TrangThaiDonHang = 'Huỷ giao', GhiChu = CONCAT(IFNULL(GhiChu, ''), ' - Lý do huỷ: ', ?)
        WHERE ID_DH = ?
      `;

      const [result] = await conn.execute(updateQuery, [cancelReason || 'Không có lý do', id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      // Create notification for cancellation
      const insertNotificationQuery = `
        INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB)
        VALUES (?, ?, ?)
      `;

      await conn.execute(
        insertNotificationQuery,
        [
          id,
          `Đơn hàng đã bị huỷ. Lý do: ${cancelReason || 'Không có lý do'}`,
          new Date()
        ]
      );

      await conn.commit();

      res.status(200).json({
        success: true,
        message: 'Huỷ đơn hàng thành công'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update COD status
 */
exports.updateCODStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codAmount, codReceived } = req.body;

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Update payment record
      const updateQuery = `
        UPDATE ThanhToan
        SET TienThuHo = ?
        WHERE ID_DH = ?
      `;

      const [result] = await conn.execute(updateQuery, [codAmount || 0, id]);

      if (result.affectedRows === 0) {
        // If no record was updated, it might not exist yet
        const insertQuery = `
          INSERT INTO ThanhToan (ID_DH, TienShip, TienThuHo)
          SELECT ID_DH, 0, ? FROM DonHang WHERE ID_DH = ?
        `;
        
        await conn.execute(insertQuery, [codAmount || 0, id]);
      }

      // If COD is received, update order status if it's delivered
      if (codReceived && codAmount > 0) {
        const getOrderStatusQuery = `
          SELECT TrangThaiDonHang FROM DonHang WHERE ID_DH = ?
        `;
        
        const [orderStatus] = await conn.execute(getOrderStatusQuery, [id]);
        
        if (orderStatus && orderStatus.length > 0 && orderStatus[0].TrangThaiDonHang === 'Đã giao') {
          // Create notification for COD received
          const insertNotificationQuery = `
            INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB)
            VALUES (?, ?, ?)
          `;

          await conn.execute(
            insertNotificationQuery,
            [
              id,
              `Đã nhận tiền COD: ${codAmount.toLocaleString('vi-VN')} đ`,
              new Date()
            ]
          );
        }
      }

      await conn.commit();

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin COD thành công'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Accept order by staff - changes status from "Đang chờ xử lý" to "Đã nhận hàng"
 */
exports.acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'ID nhân viên là bắt buộc'
      });
    }

    // Kiểm tra trạng thái hiện tại của đơn hàng
    const getStatusQuery = `
      SELECT TrangThaiDonHang FROM DonHang WHERE ID_DH = ?
    `;

    const [orderStatus] = await executeQuery(getStatusQuery, [id]);

    if (!orderStatus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép chấp nhận đơn nếu trạng thái là "Đang chờ xử lý"
    if (orderStatus.TrangThaiDonHang !== 'Đang chờ xử lý') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xác nhận đơn hàng ở trạng thái đang chờ xử lý'
      });
    }

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Cập nhật nhân viên xử lý đơn hàng nếu có thay đổi
      const updateStaffQuery = `
        UPDATE DonHang
        SET ID_NV = ?
        WHERE ID_DH = ?
      `;

      await conn.execute(updateStaffQuery, [staffId, id]);

      // Cập nhật trạng thái đơn hàng thành "Đã nhận hàng"
      const updateStatusQuery = `
        UPDATE DonHang
        SET TrangThaiDonHang = 'Đã nhận hàng'
        WHERE ID_DH = ?
      `;

      const [result] = await conn.execute(updateStatusQuery, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      // Tạo thông báo cho việc thay đổi trạng thái
      const insertNotificationQuery = `
        INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB)
        VALUES (?, ?, ?)
      `;

      await conn.execute(
        insertNotificationQuery,
        [
          id,
          'Đơn hàng đã được nhân viên tiếp nhận xử lý',
          new Date()
        ]
      );

      await conn.commit();

      res.status(200).json({
        success: true,
        message: 'Đã tiếp nhận đơn hàng thành công'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Accept a pending order by staff and move it to official orders table
 */
exports.acceptPendingOrder = async (req, res, next) => {
  try {
    const { id } = req.params; // ID_DHT - ID của đơn hàng tạm
    const { staffId } = req.body;

    console.log(`Accepting pending order: ID_DHT=${id}, staffId=${staffId}`);

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'ID nhân viên là bắt buộc'
      });
    }    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Lấy thông tin đơn hàng tạm
      const getPendingOrderQuery = `
        SELECT * FROM DonHangTam WHERE ID_DHT = ?
      `;
      const [pendingOrderResult] = await conn.execute(getPendingOrderQuery, [id]);
      
      if (pendingOrderResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      const pendingOrder = pendingOrderResult[0];

      // Lấy thông tin thanh toán tạm
      const getPaymentQuery = `
        SELECT * FROM ThanhToanTam WHERE ID_DHT = ?
      `;
      const [paymentResult] = await conn.execute(getPaymentQuery, [id]);
      const payment = paymentResult.length > 0 ? paymentResult[0] : { TienShip: 0, TienThuHo: 0 };

      // Chuyển đơn hàng từ bảng tạm sang bảng chính thức
      const insertOrderQuery = `
        INSERT INTO DonHang (
          ID_NV, ID_KH, ID_HH, ID_NN, MaVanDon, 
          NgayTaoDon, NgayGiaoDuKien, TrangThaiDonHang, PhiGiaoHang, GhiChu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [orderResult] = await conn.execute(
        insertOrderQuery,
        [
          staffId, 
          pendingOrder.ID_KH, 
          pendingOrder.ID_HH, 
          pendingOrder.ID_NN, 
          pendingOrder.MaVanDon,
          pendingOrder.NgayTaoDon,
          pendingOrder.NgayGiaoDuKien,
          'Đã tiếp nhận', // Cập nhật trạng thái đơn hàng khi nhân viên nhận
          pendingOrder.PhiGiaoHang,
          pendingOrder.GhiChu
        ]
      );

      const orderId = orderResult.insertId;

      // Chuyển thông tin thanh toán từ bảng tạm sang bảng chính thức
      const insertPaymentQuery = `
        INSERT INTO ThanhToan (ID_DH, TienShip, TienThuHo)
        VALUES (?, ?, ?)
      `;

      await conn.execute(
        insertPaymentQuery,
        [orderId, payment.TienShip, payment.TienThuHo]
      );

      // Tạo thông báo cho đơn hàng chính thức
      const insertNotificationQuery = `
        INSERT INTO ThongBao (ID_DH, NoiDung, NgayTB)
        VALUES (?, ?, ?)
      `;

      await conn.execute(
        insertNotificationQuery,
        [
          orderId,
          `Đơn hàng đã được nhân viên ${staffId} tiếp nhận`,
          new Date()
        ]
      );

      // Xóa đơn hàng tạm và thông tin liên quan
      await conn.execute(`DELETE FROM ThongBaoTam WHERE ID_DHT = ?`, [id]);
      await conn.execute(`DELETE FROM ThanhToanTam WHERE ID_DHT = ?`, [id]);
      await conn.execute(`DELETE FROM DonHangTam WHERE ID_DHT = ?`, [id]);        
      await conn.commit();

      const orderData = {
        id: orderId,
        maVanDon: pendingOrder.MaVanDon,
        khachHangId: pendingOrder.ID_KH
      };
      
      // Gửi thông báo qua socket về việc đơn hàng đã được tiếp nhận
      socketEvents.emitOrderAccepted(orderData, staffId);

      res.status(200).json({
        success: true,
        message: 'Đã tiếp nhận đơn hàng thành công',
        data: orderData
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
exports.getOrderStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : lastDayOfMonth;

    // Format dates for MySQL
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];

    // Query to get counts by status
    const statusCountQuery = `
      SELECT 
        TrangThaiDonHang AS status,
        COUNT(*) AS count
      FROM DonHang
      WHERE NgayTaoDon BETWEEN ? AND ?
      GROUP BY TrangThaiDonHang
    `;

    // Query to get total numbers
    const totalsQuery = `
      SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN TrangThaiDonHang = 'Đã giao' THEN 1 ELSE 0 END) AS deliveredOrders,
        SUM(CASE WHEN TrangThaiDonHang = 'Giao thất bại' THEN 1 ELSE 0 END) AS failedDeliveries,
        SUM(CASE WHEN TrangThaiDonHang = 'Huỷ giao' THEN 1 ELSE 0 END) AS cancelledOrders,
        (SELECT SUM(TienThuHo) FROM ThanhToan tt 
         JOIN DonHang dh ON tt.ID_DH = dh.ID_DH
         WHERE dh.NgayTaoDon BETWEEN ? AND ?) AS totalCOD,
        (SELECT SUM(PhiGiaoHang) FROM DonHang 
         WHERE NgayTaoDon BETWEEN ? AND ?) AS totalShippingFees
      FROM DonHang
      WHERE NgayTaoDon BETWEEN ? AND ?
    `;

    // Execute queries
    const statusCounts = await executeQuery(statusCountQuery, [formattedStart, formattedEnd]);
    const [totals] = await executeQuery(totalsQuery, [
      formattedStart, formattedEnd,
      formattedStart, formattedEnd,
      formattedStart, formattedEnd
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending orders waiting for staff acceptance
 */
exports.getPendingOrders = async (req, res, next) => {
  try {
    // Base query with joins to get all necessary information
    const query = `
      SELECT 
        dht.ID_DHT,
        dht.MaVanDon,
        dht.NgayTaoDon,
        dht.NgayGiaoDuKien,
        dht.TrangThaiDonHang,
        dht.PhiGiaoHang,
        dht.GhiChu,
        kh.ID_KH,
        kh.Ten_KH AS TenKhachHang,
        kh.DiaChi AS DiaChiKH,
        tk_kh.Email AS EmailKH,
        tk_kh.SDT AS SdtKhachHang,
        nn.ID_NN,
        nn.Ten_NN AS TenNguoiNhan,
        nn.DiaChi AS DiaChiNN,
        nn.SDT AS SdtNguoiNhan,        
        hh.ID_HH,
        hh.TenHH,
        hh.SoLuong,
        hh.TrongLuong,
        hh.image,
        lhh.ID_LHH,
        lhh.TenLoaiHH,
        tchh.ID_TCHH,
        tchh.TenTCHH,
        tt.Tienship,
        tt.TienThuHo
      FROM DonHangTam dht
      JOIN KhachHang kh ON dht.ID_KH = kh.ID_KH
      JOIN TaiKhoan tk_kh ON kh.ID_TK = tk_kh.ID_TK
      JOIN NguoiNhan nn ON dht.ID_NN = nn.ID_NN
      JOIN HangHoa hh ON dht.ID_HH = hh.ID_HH
      JOIN LoaiHH lhh ON hh.ID_LHH = lhh.ID_LHH
      JOIN TinhChatHH tchh ON hh.ID_TCHH = tchh.ID_TCHH
      LEFT JOIN ThanhToanTam tt ON dht.ID_DHT = tt.ID_DHT
      WHERE dht.TrangThaiDonHang = 'Đang chờ xử lý'
      ORDER BY dht.NgayTaoDon DESC
    `;

    const pendingOrders = await executeQuery(query);

    res.status(200).json({
      success: true,
      count: pendingOrders.length,
      data: pendingOrders
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate a unique shipping code
function generateShippingCode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `VD${timestamp.substring(timestamp.length - 6)}${random}`;
}
