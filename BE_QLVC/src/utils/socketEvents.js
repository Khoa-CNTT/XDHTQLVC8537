/**
 * Các sự kiện socket liên quan đến đơn hàng
 */

const EVENT_TYPES = {
  NEW_ORDER: "new_order",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_STATUS_CHANGED: "order_status_changed",
  ORDER_CANCELED: "order_canceled",
  ORDER_COMPLETED: "order_completed",
  COD_UPDATED: "cod_updated",
  NOTIFICATION: "notification",
};

const emitNewOrder = (order) => {
  if (!global.io) return;

  // Điều chỉnh để bao gồm thêm thông tin cần thiết cho trang xác nhận admin
  global.io.emit(EVENT_TYPES.NEW_ORDER, {
    orderId: order.id || order.ID_DHT,
    maVanDon: order.maVanDon || order.MaVanDon,
    receiverName:
      order.receiverName || order.tenNguoiNhan || order.Ten_NN || null,
    paymentMethod: order.paymentMethod || null,
    timestamp: Date.now(),
    message: "Có đơn hàng mới được tạo",
  });

  // Thông báo riêng cho phòng nhân viên - gửi toàn bộ thông tin đơn hàng
  global.io.to("staff").emit(EVENT_TYPES.NOTIFICATION, {
    type: "new_order",
    message: "Có đơn hàng mới cần xử lý!",
    data: order,
  });
};

const emitOrderAccepted = (order, staffId) => {
  if (!global.io) return;

  global.io.emit(EVENT_TYPES.ORDER_ACCEPTED, {
    orderId: order.id,
    maVanDon: order.maVanDon,
    staffId: staffId,
    timestamp: Date.now(),
    message: "Đơn hàng đã được tiếp nhận",
  });

  if (order.khachHangId) {
    global.io
      .to(`customer_${order.khachHangId}`)
      .emit(EVENT_TYPES.NOTIFICATION, {
        type: "order_accepted",
        message: "Đơn hàng của bạn đã được nhân viên tiếp nhận",
        data: order,
      });
  }
};

const emitOrderStatusChanged = (order, oldStatus, newStatus) => {
  if (!global.io) return;

  global.io.emit(EVENT_TYPES.ORDER_STATUS_CHANGED, {
    orderId: order.id || order.ID_DH,
    maVanDon: order.maVanDon || order.MaVanDon,
    oldStatus: oldStatus,
    newStatus: newStatus,
    timestamp: Date.now(),
    message: `Đơn hàng đã chuyển trạng thái từ "${oldStatus}" sang "${newStatus}"`,
  });

  if (order.khachHangId || order.ID_KH) {
    const khachHangId = order.khachHangId || order.ID_KH;
    global.io.to(`customer_${khachHangId}`).emit(EVENT_TYPES.NOTIFICATION, {
      type: "status_updated",
      message: `Đơn hàng của bạn đã chuyển trạng thái thành "${newStatus}"`,
      data: { orderId: order.id || order.ID_DH, status: newStatus },
    });
  }
};

const emitOrderCanceled = (order, reason) => {
  if (!global.io) return;

  global.io.emit(EVENT_TYPES.ORDER_CANCELED, {
    orderId: order.id || order.ID_DH,
    maVanDon: order.maVanDon || order.MaVanDon,
    reason: reason,
    timestamp: Date.now(),
    message: `Đơn hàng đã bị huỷ. Lý do: ${reason}`,
  });
};

module.exports = {
  EVENT_TYPES,
  emitNewOrder,
  emitOrderAccepted,
  emitOrderStatusChanged,
  emitOrderCanceled,
};
