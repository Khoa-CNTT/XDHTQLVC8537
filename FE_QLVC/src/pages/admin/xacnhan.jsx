import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import socketService from "../../services/socketService";

const XacNhanDonHang = () => {  
  const [pendingOrders, setPendingOrders] = useState([]);
  
  // Extract socket connection logic to a separate function for reuse
  const ensureSocketConnection = useCallback(async () => {
    try {
      if (!socketService.socket || !socketService.socket.connected) {
        console.log("Đang kết nối socket cho admin...");
        socketService.connect(null, 'admin');
        
        // Wait for connection to establish
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Socket connection timeout"));
          }, 5000);
          
          const checkConnection = setInterval(() => {
            if (socketService.socket && socketService.socket.connected) {
              clearInterval(checkConnection);
              clearTimeout(timeout);
              resolve();
            }
          }, 100);
        });
        return true;
      }
      return true;
    } catch (error) {
      console.error("Lỗi kết nối socket:", error);
      toast.error("Không thể kết nối với máy chủ thông báo. Vui lòng tải lại trang!");
      return false;
    }
  }, []);
  
  useEffect(() => {
    // Initialize socket connection
    ensureSocketConnection().catch(err => {
      console.error("Lỗi khởi tạo socket:", err);
    });
    
    // Set up event handlers only after connection is established
    const setupEventHandlers = () => {
      const unsubNewOrder = socketService.onNewOrder((order) => {
        console.log("Received new order data:", order);
        // Kiểm tra xem đơn hàng đã tồn tại trong danh sách chưa
        const orderKey = order.maVanDon || order.MaVanDon;
        setPendingOrders((prev) => {
          // Kiểm tra xem đơn hàng có ID này đã có trong danh sách chưa
          const orderExists = prev.some(existingOrder => 
            (existingOrder.maVanDon === orderKey || existingOrder.MaVanDon === orderKey)
          );
          
          // Chỉ thêm đơn hàng nếu nó chưa tồn tại trong danh sách
          return orderExists ? prev : [...prev, order];
        });
        toast.info(
          `Đơn hàng mới ${order.maVanDon || order.MaVanDon || "N/A"} vừa được tạo!`
        );
      });
      
      // Thêm lắng nghe sự kiện notification vì nó có thể chứa dữ liệu đầy đủ hơn
      const unsubNotification = socketService.onNotification((notification) => {
        if (notification && notification.type === 'new_order' && notification.data) {
          console.log("Received new order notification:", notification.data);
          // Kiểm tra xem đơn hàng đã tồn tại trong danh sách chưa
          const orderKey = notification.data.maVanDon || notification.data.MaVanDon;
          setPendingOrders((prev) => {
            // Kiểm tra xem đơn hàng có ID này đã có trong danh sách chưa
            const orderExists = prev.some(existingOrder => 
              (existingOrder.maVanDon === orderKey || existingOrder.MaVanDon === orderKey)
            );
            
            // Chỉ thêm đơn hàng nếu nó chưa tồn tại trong danh sách
            return orderExists ? prev : [...prev, notification.data];
          });
        }
      });
      
      return { unsubNewOrder, unsubNotification };
    };
    
    const handlers = setupEventHandlers();
    
    // Clean up event handlers and socket connection when component unmounts
    return () => {
      if (handlers.unsubNewOrder) handlers.unsubNewOrder();
      if (handlers.unsubNotification) handlers.unsubNotification();
    };
  }, [ensureSocketConnection]);
  
  // Add a function to save the order locally when connection fails
  const saveOrderLocallyIfNeeded = (order) => {
    try {
      // Get existing saved orders
      const savedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
      
      // Add this order if not already saved
      const orderExists = savedOrders.some(o => 
        (o.maVanDon === order.maVanDon || o.MaVanDon === order.MaVanDon)
      );
      
      if (!orderExists) {
        savedOrders.push(order);
        localStorage.setItem('pendingConfirmations', JSON.stringify(savedOrders));
        console.log("Đã lưu đơn hàng vào bộ nhớ cục bộ để xử lý sau");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng vào bộ nhớ cục bộ:", error);
      return false;
    }
  };

  const handleConfirmPendingOrder = async (order) => {
    if (
      window.confirm(
        `Xác nhận tiếp nhận đơn hàng mới: ${
          order.maVanDon || order.MaVanDon || "N/A"
        }?`
      )
    ) {
      try {
        // Ensure socket is connected
        const isConnected = await ensureSocketConnection();
        
        // Lấy thông tin người dùng từ đơn hàng
        const userId = order.ID_KH || order.userId || order.id_kh || 
                      (order.data && order.data.ID_KH) || 
                      (order.data && order.data.userId);
        
        const orderId = order.ID_DH || order.orderId || order.id || 
                       (order.data && order.data.ID_DH) || 
                       (order.data && order.data.orderId);
        
        // Kiểm tra phương thức thanh toán
        const isOnlinePayment = order.paymentMethod === 'online' || 
            order.payment_method === 'online' || 
            order.PaymentMethod === 'online' ||
            (order.data && order.data.paymentMethod === 'online');
        
        // If we have a socket connection, try to send confirmation
        let confirmationSent = false;
        if (isConnected && socketService.socket) {
          console.log("Đang gửi xác nhận qua socket cho:", {orderId, userId, isOnlinePayment});
          confirmationSent = socketService.sendPaymentConfirmation(orderId, userId, isOnlinePayment);
        }
        
        // Handle result
        if (confirmationSent) {
          if (isOnlinePayment) {
            toast.success("Đã xác nhận thanh toán thành công và gửi thông báo cho người dùng!");
          } else {
            toast.success("Đã xác nhận đơn hàng và gửi thông báo cho người dùng!");
          }
        } else {
          // Save locally for retry if notification couldn't be sent
          saveOrderLocallyIfNeeded(order);
          
          if (!userId) {
            toast.warning("Không thể xác định người dùng, đơn hàng được xác nhận nhưng không thể gửi thông báo!");
          } else {
            toast.warning("Đã xác nhận đơn hàng nhưng không thể gửi thông báo cho người dùng!");
          }
        }
        
        // Xóa đơn hàng khỏi danh sách chờ xác nhận
        setPendingOrders((prev) => prev.filter((o) => o !== order));
      } catch (error) {
        console.error("Lỗi khi xử lý xác nhận đơn hàng:", error);
        toast.error("Có lỗi xảy ra khi xác nhận đơn hàng!");
      }
    }
  };

  return (
    <div className="pending-orders-alert">
      <h3>Đơn hàng mới chờ xác nhận:</h3>
      {pendingOrders.length === 0 ? (
        <div>Không có đơn hàng chờ xác nhận.</div>
      ) : (
        <ul>
          {pendingOrders.map((order, idx) => (
            <li
              key={`order-${order.maVanDon || order.MaVanDon || idx}-${idx}`}
              className="pending-order-item"
            >
              <span>
                Mã vận đơn: <b>{order.maVanDon || order.MaVanDon || "N/A"}</b> - Tên Người Nhận: <b>
                  {/* Ưu tiên receiverName, sau đó tenNguoiNhan, TenNguoiNhan, Ten_NN, tenNN, etc */}
                  {order.receiverName ||
                    order.ReceiverName ||
                    order.tenNguoiNhan ||
                    order.TenNguoiNhan ||
                    (order.nguoiNhan && order.nguoiNhan.ten) ||
                    (order.data && order.data.receiverName) ||
                    (order.data && order.data.tenNguoiNhan) ||
                    (order.data && order.data.nguoiNhan && order.data.nguoiNhan.ten) ||
                    "N/A"}
                </b> - Khách Hàng: <b>
                  {/* Thông tin khách hàng */}
                  {order.tenKhachHang ||
                    order.TenKhachHang ||
                    order.TenKH ||
                    order.tenKH ||
                    (order.data && order.data.tenKhachHang) ||
                    (order.data && order.data.TenKhachHang) ||
                    "N/A"}
                </b>
                <br />
                Phương thức thanh toán: <b>
                  {/* Kiểm tra chi tiết tất cả các trường có thể chứa thông tin thanh toán */}
                  {order.paymentMethod === 'cash' || 
                   order.payment_method === 'cash' || 
                   order.PaymentMethod === 'cash' || 
                   (order.data && order.data.paymentMethod === 'cash') ||
                   order.paymentMethod === 1 || 
                   order.payment_method === 1 || 
                   order.PaymentMethod === 1
                    ? 'Tiền mặt khi nhận hàng'
                    : order.paymentMethod === 'online' || 
                      order.payment_method === 'online' || 
                      order.PaymentMethod === 'online' ||
                      (order.data && order.data.paymentMethod === 'online') ||
                      order.paymentMethod === 2 || 
                      order.payment_method === 2 || 
                      order.PaymentMethod === 2 || 
                      order.paymentMethod === 'momo'
                    ? 'Chuyển khoản/MoMo'
                    : 'Chưa xác định'}
                </b>
                {/* In ra paymentMethod để debug */}
                {console.log("Thông tin đơn hàng đầy đủ:", order)}
              </span>
              <button
                className="confirm-pending-btn"
                onClick={() => handleConfirmPendingOrder(order)}
              >
                Xác nhận
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default XacNhanDonHang;
