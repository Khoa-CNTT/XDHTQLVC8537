import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import socketService from "../../services/socketService";

const XacNhanDonHang = () => {  
  const [pendingOrders, setPendingOrders] = useState([]);
  
  // Improve loading from localStorage with better error handling and logs
  useEffect(() => {
    try {
      // Load saved orders from localStorage on component mount
      const savedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
      if (savedOrders.length > 0) {
        console.log("Đang tải đơn hàng đã lưu từ bộ nhớ cục bộ:", savedOrders.length);
        setPendingOrders(prevOrders => {
          // Combine with any existing orders, avoiding duplicates
          const combinedOrders = [...prevOrders];
          savedOrders.forEach(savedOrder => {
            const savedOrderKey = savedOrder.maVanDon || savedOrder.MaVanDon || savedOrder.ID_DH || savedOrder.id;
            const orderExists = combinedOrders.some(existingOrder => 
              (existingOrder.maVanDon === savedOrderKey || 
               existingOrder.MaVanDon === savedOrderKey ||
               existingOrder.ID_DH === savedOrderKey || 
               existingOrder.id === savedOrderKey)
            );
            if (!orderExists) {
              combinedOrders.push(savedOrder);
            }
          });
          return combinedOrders;
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng từ bộ nhớ cục bộ:", error);
      // Attempt recovery if possible
      try {
        const backupKey = 'pendingConfirmations_backup';
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          const backupOrders = JSON.parse(backupData);
          if (Array.isArray(backupOrders) && backupOrders.length > 0) {
            console.log("Phục hồi từ bản sao lưu:", backupOrders.length);
            setPendingOrders(backupOrders);
            // Restore the backup to main storage
            localStorage.setItem('pendingConfirmations', JSON.stringify(backupOrders));
          }
        }
      } catch (backupError) {
        console.error("Không thể khôi phục từ bản sao lưu:", backupError);
      }
    }
  }, []);
  
  // Auto-save pendingOrders to localStorage whenever it changes
  useEffect(() => {
    // Only save if there are orders to save
    if (pendingOrders.length > 0) {
      try {
        localStorage.setItem('pendingConfirmations', JSON.stringify(pendingOrders));
        // Create a backup copy
        localStorage.setItem('pendingConfirmations_backup', JSON.stringify(pendingOrders));
        console.log("Đã lưu", pendingOrders.length, "đơn hàng vào bộ nhớ cục bộ");
      } catch (error) {
        console.error("Lỗi khi lưu đơn hàng vào bộ nhớ cục bộ:", error);
      }
    } else if (pendingOrders.length === 0) {
      // Clear storage if no orders
      localStorage.removeItem('pendingConfirmations');
      // But keep the backup just in case
    }
  }, [pendingOrders]);
  
  // Setup periodic backup of pendingOrders (every 30 seconds)
  useEffect(() => {
    const backupInterval = setInterval(() => {
      if (pendingOrders.length > 0) {
        try {
          const timestamp = new Date().toISOString();
          localStorage.setItem(
            `pendingConfirmations_backup_${timestamp}`, 
            JSON.stringify(pendingOrders)
          );
          // Keep only the 3 most recent backups
          const backupKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pendingConfirmations_backup_')) {
              backupKeys.push(key);
            }
          }
          backupKeys.sort().reverse();
          backupKeys.slice(3).forEach(key => {
            localStorage.removeItem(key);
          });
        } catch (error) {
          console.error("Lỗi khi tạo bản sao lưu:", error);
        }
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(backupInterval);
  }, [pendingOrders]);
  
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
        const orderKey = order.maVanDon || order.MaVanDon || order.ID_DH || order.id;
        setPendingOrders((prev) => {
          // Kiểm tra xem đơn hàng có ID này đã có trong danh sách chưa
          const orderExists = prev.some(existingOrder => 
            (existingOrder.maVanDon === orderKey || 
             existingOrder.MaVanDon === orderKey ||
             existingOrder.ID_DH === orderKey ||
             existingOrder.id === orderKey)
          );
          
          // Chỉ thêm đơn hàng nếu nó chưa tồn tại trong danh sách
          if (orderExists) {
            return prev;
          } else {
            // Make a deep copy to ensure state changes trigger useEffect for localStorage save
            const newOrder = JSON.parse(JSON.stringify(order));
            // Add timestamp for tracking
            newOrder._receivedAt = new Date().toISOString();
            return [...prev, newOrder];
          }
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
          const orderKey = notification.data.maVanDon || 
                          notification.data.MaVanDon || 
                          notification.data.ID_DH || 
                          notification.data.id;
          setPendingOrders((prev) => {
            // Kiểm tra xem đơn hàng có ID này đã có trong danh sách chưa
            const orderExists = prev.some(existingOrder => 
              (existingOrder.maVanDon === orderKey || 
               existingOrder.MaVanDon === orderKey ||
               existingOrder.ID_DH === orderKey ||
               existingOrder.id === orderKey)
            );
            
            // Chỉ thêm đơn hàng nếu nó chưa tồn tại trong danh sách
            if (orderExists) {
              return prev;
            } else {
              // Make a deep copy to ensure state changes trigger useEffect
              const newOrderData = JSON.parse(JSON.stringify(notification.data));
              // Add timestamp for tracking
              newOrderData._receivedAt = new Date().toISOString();
              return [...prev, newOrderData];
            }
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
  
  // Improved function to save the order locally when connection fails
  const saveOrderLocallyIfNeeded = (order) => {
    try {
      // Get existing saved orders
      const savedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
      
      // Add this order if not already saved
      const orderExists = savedOrders.some(o => 
        (o.maVanDon === order.maVanDon || 
         o.MaVanDon === order.MaVanDon ||
         o.ID_DH === order.ID_DH ||
         o.id === order.id)
      );
      
      if (!orderExists) {
        // Deep clone to avoid reference issues
        const orderToSave = JSON.parse(JSON.stringify(order));
        // Add timestamp
        orderToSave._savedAt = new Date().toISOString();
        savedOrders.push(orderToSave);
        localStorage.setItem('pendingConfirmations', JSON.stringify(savedOrders));
        // Also create a backup
        localStorage.setItem('pendingConfirmations_backup', JSON.stringify(savedOrders));
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
          // Lấy thông tin người dùng từ đơn hàng - cải thiện để tìm thông tin trong nhiều vị trí hơn
        console.log("Thông tin đơn hàng đầy đủ trước khi xác nhận:", order);        // Trích xuất ID khách hàng từ nhiều vị trí có thể có - cải tiến để phát hiện tất cả khả năng
        console.log("Đang trích xuất thông tin khách hàng từ đơn hàng:", order);
        
        // Tìm ID khách hàng từ nhiều vị trí có thể có
        let userId = order.ID_KH || 
                    order.userId || 
                    order.id_kh || 
                    order.khachHangId ||
                    (order.data && order.data.ID_KH) || 
                    (order.data && order.data.userId);
                    
        // Thử tìm trong thuộc tính khachHang nếu có
        if (!userId && order.khachHang) {
          userId = order.khachHang.ID_KH || order.khachHang.id;
        }
        
        // Nếu vẫn không tìm thấy, thử lấy từ orderData
        if (!userId && order.orderData) {
          userId = order.orderData.ID_KH || order.orderData.userId || order.orderData.id_kh;
        }
        
        // Xử lý thông báo socket từ backend Node.js có cấu trúc khác
        // Khi chạy server, backend gửi thông báo với cấu trúc khác
        if (!userId && typeof order.id !== 'undefined') {
          if (typeof order.khachHangId !== 'undefined') {
            console.log("Đang sử dụng ID từ khachHangId trong đơn hàng:", order.khachHangId);
            userId = order.khachHangId;
          } else if (typeof order.ID_KH !== 'undefined') {
            console.log("Đang sử dụng ID từ ID_KH trong đơn hàng:", order.ID_KH);
            userId = order.ID_KH;
          }
        }
        
        // Kiểm tra đơn hàng từ bảng tạm trong DB MySQL
        if (!userId && order.ID_DHT) {
          console.log("Đơn hàng từ bảng tạm, đang tìm khachHangId từ ID_DHT:", order.ID_DHT);
          userId = order.ID_KH; // ID_KH trong DonHangTam
        }
        
        // Để debug, ghi log các trường định danh
        console.log("Các trường định danh có trong đơn hàng:", {
          ID_KH: order.ID_KH,
          userId: order.userId,
          id_kh: order.id_kh,
          khachHangId: order.khachHangId,
          id: order.id,
          ID_DHT: order.ID_DHT
        });
          // Nếu không tìm thấy userId, nhưng có maVanDon, cố gắng lấy thông tin từ khách hàng tạm
        if (!userId && (order.maVanDon || order.MaVanDon)) {
          console.warn("Không tìm thấy ID khách hàng trong đơn hàng thông thường, kiểm tra cấu trúc SQL");
          
          // Kiểm tra trường hợp đơn hàng từ MySQL - sử dụng ID_KH và Ten_KH
          if (order.ID_DHT && order.ID_KH) {
            console.log("Đơn hàng từ MySQL với ID_DHT:", order.ID_DHT, "và ID_KH:", order.ID_KH);
            userId = order.ID_KH;
          } else if (order.TenKhachHang) {
            // Nếu có TenKhachHang từ database nhưng không có ID, tìm khách hàng từ đơn hàng trước đó
            const cachedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
            const similarOrder = cachedOrders.find(o => 
              o.TenKhachHang === order.TenKhachHang && o.ID_KH
            );
            
            if (similarOrder && similarOrder.ID_KH) {
              console.log("Đã tìm thấy ID_KH từ đơn hàng cached:", similarOrder.ID_KH);
              userId = similarOrder.ID_KH;
            }
          }
          
          // Nếu vẫn không tìm thấy, gắn default userId để có thể tiếp tục - chỉ là giải pháp tạm thời
          if (!userId) {
            console.warn("Không tìm thấy ID khách hàng trong đơn hàng, sẽ gửi notification không kèm user ID");
            // Sử dụng userId mặc định nếu có dữ liệu từ nguồn khác
            if (order.nguoiNhan && order.nguoiNhan.id) {
              console.log("Sử dụng ID người nhận thay thế:", order.nguoiNhan.id);
              userId = order.nguoiNhan.id; // Sử dụng ID người nhận thay thế
            }
          }
        }
        
        // Tương tự cho orderId
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
          
          // Gửi thông báo tới staff về đơn hàng mới được xác nhận
          socketService.socket.emit('order:confirmed', {
            orderId,
            orderData: order,
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'admin',
            message: `Đơn hàng ${order.maVanDon || order.MaVanDon || orderId || "N/A"} đã được xác nhận!`
          });
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
                    "N/A"}                </b> - Khách Hàng: <b>
                  {/* Thông tin khách hàng */}
                  {order.tenKhachHang ||
                    order.TenKhachHang || 
                    (order.khachHang && order.khachHang.tenKhachHang) || 
                    (order.khachHang && order.khachHang.TenKhachHang) ||
                    (order.khachHang && order.khachHang.Ten_KH) ||
                    // Thêm tìm kiếm trường để phù hợp với dữ liệu socket từ backend Node.js
                    order.Ten_KH ||
                    "N/A"}
                </b>
                <br />
                Phương thức thanh toán: <b>
                  {/* Kiểm tra chi tiết tất cả các trường có thể chứa thông tin thanh toán */}
                  {order.paymentMethod === 'cash' ||  
                   (order.data && order.data.paymentMethod === 'cash') ||
                   order.paymentMethod === 1 
                    ? 'Tiền mặt khi nhận hàng'
                    : order.paymentMethod === 'online' || 
                      
                      (order.data && order.data.paymentMethod === 'online') ||
                      order.paymentMethod === 2 || 
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
