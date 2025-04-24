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
};

/**
 * Gửi thông báo cho tất cả clients khi có đơn hàng mới
 * @param {Object} order - Thông tin đơn hàng
 */
const emitNewOrder = (order) => {
  if (!global.io) return;
  
  global.io.emit(EVENT_TYPES.NEW_ORDER, {
    orderId: order.id || order.ID_DHT,
    maVanDon: order.maVanDon || order.MaVanDon,
    timestamp: Date.now(),
    message: 'Có đơn hàng mới được tạo'
  });

  // Thông báo riêng cho phòng nhân viên
  global.io.to('staff').emit(EVENT_TYPES.NOTIFICATION, {
    type: 'new_order',
    message: 'Có đơn hàng mới cần xử lý!',
    data: order
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

module.exports = {
  EVENT_TYPES,
  emitNewOrder,
  emitOrderAccepted,
  emitOrderStatusChanged,
  emitOrderCanceled
};
