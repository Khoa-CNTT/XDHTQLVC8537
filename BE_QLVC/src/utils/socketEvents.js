/**
 * Các sự kiện socket liên quan đến đơn hàng
 */

// Danh sách các event types
const EVENT_TYPES = {
  NEW_ORDER: 'new_order',                     // Có đơn hàng mới được tạo
  ORDER_ACCEPTED: 'order_accepted',           // Đơn hàng được tiếp nhận
  ORDER_STATUS_CHANGED: 'order_status_changed', // Trạng thái đơn hàng thay đổi
  ORDER_CANCELED: 'order_canceled',           // Đơn hàng bị huỷ
  ORDER_COMPLETED: 'order_completed',         // Đơn hàng hoàn thành
  COD_UPDATED: 'cod_updated',                 // Cập nhật tình trạng COD
  NOTIFICATION: 'notification',               // Thông báo chung
  ORDER_CONFIRMED: 'order:confirmed',         // Đơn hàng được admin xác nhận
  PAYMENT_CONFIRMATION: 'payment:confirmation' // Xác nhận thanh toán
};

/**
 * Gửi thông báo cho tất cả clients khi có đơn hàng mới
 * @param {Object} order - Thông tin đơn hàng
 */
const emitNewOrder = (order) => {
  if (!global.io) return;
  
  // Log đầy đủ thông tin đơn hàng để debug
  console.log('Emitting new order with data:', JSON.stringify(order, null, 2));
  
  // Đảm bảo các trường quan trọng của khách hàng được truyền đi
  const enhancedOrder = {
    // Trường định danh đơn hàng
    ID_DHT: order.id || order.ID_DHT,
    id: order.id || order.ID_DHT,
    orderId: order.id || order.ID_DHT,
    
    // Mã vận đơn - chuẩn hoá cả 2 format
    MaVanDon: order.maVanDon || order.MaVanDon,
    maVanDon: order.maVanDon || order.MaVanDon,
    
    // Thông tin khách hàng - đảm bảo đủ các trường
    ID_KH: order.khachHangId,
    khachHangId: order.khachHangId,
    userId: order.khachHangId,
    TenKhachHang: order.tenKhachHang || '',
    tenKhachHang: order.tenKhachHang || '',
    
    // Thông tin người nhận
    receiverName: order.receiverName || (order.nguoiNhan ? order.nguoiNhan.ten : null) || '',
    tenNguoiNhan: order.receiverName || (order.nguoiNhan ? order.nguoiNhan.ten : null) || '',
    Ten_NN: order.receiverName || (order.nguoiNhan ? order.nguoiNhan.ten : null) || '',
    
    // Thông tin thanh toán
    paymentMethod: order.paymentMethod || 'cash',
    
    // Metadata
    timestamp: Date.now(),
    message: 'Có đơn hàng mới được tạo',
    
    // Giữ lại các thông tin khác từ đơn hàng gốc
    ...order
  };
  
  // Gửi thông báo đơn hàng mới cho tất cả clients
  global.io.emit(EVENT_TYPES.NEW_ORDER, enhancedOrder);

  // Thông báo riêng cho phòng staff với đầy đủ thông tin
  global.io.to('staff').emit(EVENT_TYPES.NOTIFICATION, {
    type: 'new_order',
    message: 'Có đơn hàng mới cần xử lý!',
    priority: 'medium',
    data: enhancedOrder
  });
  
  // Gửi thông báo riêng cho admin để xác nhận
  global.io.to('admin').emit(EVENT_TYPES.NOTIFICATION, {
    type: 'new_order',
    message: `Đơn hàng mới #${enhancedOrder.MaVanDon} từ ${enhancedOrder.TenKhachHang || 'Khách hàng'} cần được xác nhận!`,
    priority: 'high',
    data: enhancedOrder
  });
};

/**
 * Thông báo khi đơn hàng tạm được nhân viên tiếp nhận
 * @param {Object} order - Thông tin đơn hàng
 * @param {number} staffId - ID của nhân viên tiếp nhận
 */
const emitOrderAccepted = (order, staffId) => {
  if (!global.io) return;
  
  global.io.emit(EVENT_TYPES.ORDER_ACCEPTED, {
    orderId: order.id,
    maVanDon: order.maVanDon,
    staffId: staffId,
    timestamp: Date.now(),
    message: 'Đơn hàng đã được tiếp nhận'
  });

  // Thông báo cho khách hàng cụ thể (nếu họ đang online)
  if (order.khachHangId) {
    global.io.to(`customer_${order.khachHangId}`).emit(EVENT_TYPES.NOTIFICATION, {
      type: 'order_accepted',
      message: 'Đơn hàng của bạn đã được nhân viên tiếp nhận',
      data: order
    });
  }
};

/**
 * Thông báo khi trạng thái đơn hàng thay đổi
 * @param {Object} order - Thông tin đơn hàng
 * @param {string} oldStatus - Trạng thái cũ
 * @param {string} newStatus - Trạng thái mới
 */
const emitOrderStatusChanged = (order, oldStatus, newStatus) => {
  if (!global.io) return;
  
  global.io.emit(EVENT_TYPES.ORDER_STATUS_CHANGED, {
    orderId: order.id || order.ID_DH,
    maVanDon: order.maVanDon || order.MaVanDon,
    oldStatus: oldStatus,
    newStatus: newStatus,
    timestamp: Date.now(),
    message: `Đơn hàng đã chuyển trạng thái từ "${oldStatus}" sang "${newStatus}"`
  });

  // Thông báo cho khách hàng cụ thể (nếu họ đang online)
  if (order.khachHangId || order.ID_KH) {
    const khachHangId = order.khachHangId || order.ID_KH;
    global.io.to(`customer_${khachHangId}`).emit(EVENT_TYPES.NOTIFICATION, {
      type: 'status_updated',
      message: `Đơn hàng của bạn đã chuyển trạng thái thành "${newStatus}"`,
      data: { orderId: order.id || order.ID_DH, status: newStatus }
    });
  }
};

/**
 * Thông báo khi đơn hàng bị huỷ
 * @param {Object} order - Thông tin đơn hàng
 * @param {string} reason - Lý do huỷ
 */
const emitOrderCanceled = (order, reason) => {
  if (!global.io) return;
  
  global.io.emit(EVENT_TYPES.ORDER_CANCELED, {
    orderId: order.id || order.ID_DH,
    maVanDon: order.maVanDon || order.MaVanDon,
    reason: reason,
    timestamp: Date.now(),
    message: `Đơn hàng đã bị huỷ. Lý do: ${reason}`
  });
};

/**
 * Xử lý khi admin xác nhận đơn hàng
 * @param {Object} orderData - Thông tin đơn hàng
 * @param {string} userId - ID của khách hàng
 * @param {boolean} isOnlinePayment - Có phải thanh toán online không
 */
const emitPaymentConfirmation = (orderId, userId, isOnlinePayment) => {
  if (!global.io) return false;
  
  console.log(`Gửi xác nhận thanh toán: orderId=${orderId}, userId=${userId}, isOnline=${isOnlinePayment}`);
  
  if (!userId) {
    console.warn("Thiếu thông tin userId khi gửi xác nhận thanh toán");
    return false;
  }
  
  try {
    // Gửi thông báo tới khách hàng cụ thể
    global.io.to(`customer_${userId}`).emit(EVENT_TYPES.NOTIFICATION, {
      type: isOnlinePayment ? 'payment_confirmed' : 'order_confirmed',
      message: isOnlinePayment 
        ? 'Thanh toán đơn hàng của bạn đã được xác nhận' 
        : 'Đơn hàng của bạn đã được xác nhận',
      data: {
        orderId: orderId,
        confirmedAt: new Date().toISOString()
      }
    });
    
    // Ghi log để debug
    console.log(`Đã gửi xác nhận ${isOnlinePayment ? 'thanh toán' : 'đơn hàng'} cho khách hàng ${userId}`);
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi thông báo xác nhận:", error);
    return false;
  }
};

/**
 * Thiết lập socket event handlers cho server
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  if (!io) return;
  
  io.on('connection', (socket) => {
    console.log('Client kết nối:', socket.id);
    
    // Xử lý sự kiện order:confirmed từ admin
    socket.on(EVENT_TYPES.ORDER_CONFIRMED, (data) => {
      console.log('Nhận sự kiện order:confirmed:', data);
      
      // Chuyển tiếp thông báo cho nhân viên và khách hàng liên quan
      if (data && data.orderId) {
        // Thông báo cho staff
        io.to('staff').emit(EVENT_TYPES.NOTIFICATION, {
          type: 'order_confirmed',
          message: data.message || 'Đơn hàng đã được xác nhận',
          data: data
        });
        
        // Thông báo cho khách hàng cụ thể (nếu có userId hoặc khachHangId)
        const userId = data.userId || data.khachHangId || 
                      (data.orderData && data.orderData.ID_KH) ||
                      (data.orderData && data.orderData.khachHangId);
                      
        if (userId) {
          io.to(`customer_${userId}`).emit(EVENT_TYPES.NOTIFICATION, {
            type: 'order_confirmed',
            message: 'Đơn hàng của bạn đã được xác nhận',
            data: data
          });
        }
      }
    });
    
    // Xử lý sự kiện payment:confirmation từ admin
    socket.on(EVENT_TYPES.PAYMENT_CONFIRMATION, (data) => {
      console.log('Nhận sự kiện payment:confirmation:', data);
      
      if (data && data.orderId && data.userId) {
        emitPaymentConfirmation(data.orderId, data.userId, data.isOnlinePayment || false);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client ngắt kết nối:', socket.id);
    });
  });
};

module.exports = {
  EVENT_TYPES,
  emitNewOrder,
  emitOrderAccepted,
  emitOrderStatusChanged,
  emitOrderCanceled,
  emitPaymentConfirmation,
  setupSocketHandlers
};
