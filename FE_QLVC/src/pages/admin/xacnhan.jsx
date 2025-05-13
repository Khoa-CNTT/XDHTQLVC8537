import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import socketService from "../../services/socketService";
import './XacnhanStyles.css'; // Import the new CSS file

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
    const setupEventHandlers = () => {      const unsubNewOrder = socketService.onNewOrder((order) => {
        console.log("Received new order data:", order);
        
        // Chuẩn hóa cấu trúc đơn hàng
        const normalizedOrder = normalizeOrderStructure(order);
        console.log("Đơn hàng sau khi chuẩn hóa:", normalizedOrder);
        
        // Kiểm tra xem đơn hàng đã tồn tại trong danh sách chưa
        const orderKey = normalizedOrder.maVanDon || normalizedOrder.MaVanDon || normalizedOrder.ID_DH || normalizedOrder.id;
        
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
            // Add timestamp for tracking
            normalizedOrder._receivedAt = new Date().toISOString();
            return [...prev, normalizedOrder];
          }
        });
        
        toast.info(
          `Đơn hàng mới ${normalizedOrder.maVanDon || normalizedOrder.MaVanDon || "N/A"} vừa được tạo!`
        );
      });
        // Thêm lắng nghe sự kiện notification vì nó có thể chứa dữ liệu đầy đủ hơn
      const unsubNotification = socketService.onNotification((notification) => {
        if (notification && notification.type === 'new_order' && notification.data) {
          console.log("Received new order notification:", notification.data);
          
          // Chuẩn hóa cấu trúc đơn hàng từ thông báo
          const normalizedOrderData = normalizeOrderStructure(notification.data);
          console.log("Dữ liệu đơn hàng từ thông báo sau khi chuẩn hóa:", normalizedOrderData);
          
          // Kiểm tra xem đơn hàng đã tồn tại trong danh sách chưa
          const orderKey = normalizedOrderData.maVanDon || 
                          normalizedOrderData.MaVanDon || 
                          normalizedOrderData.ID_DH || 
                          normalizedOrderData.id;
                          
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
              // Add timestamp for tracking
              normalizedOrderData._receivedAt = new Date().toISOString();
              // Thêm thông tin nguồn
              normalizedOrderData._source = 'notification';
              return [...prev, normalizedOrderData];
            }
          });
          
          // Thử hiển thị thêm thông tin để debug
          if (!orderKey) {
            console.warn("Không tìm thấy mã đơn hàng trong notification:", notification);
          }
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
  // Hàm chuẩn hóa và sửa chữa cấu trúc đơn hàng không đúng - mở rộng để đối phó với nhiều cấu trúc dữ liệu
  const normalizeOrderStructure = (order) => {
    if (!order) return order;
    
    // Ghi log chi tiết cấu trúc đơn hàng gốc để debug
    console.log("Cấu trúc đơn hàng gốc:", JSON.stringify(order, null, 2));
    
    // Deep clone để tránh tham chiếu
    const fixedOrder = JSON.parse(JSON.stringify(order));
    
    // PHẦN 1: Chuẩn hoá các trường cơ bản
    // ---------------------------------
    
    // Chuẩn hoá mã vận đơn - đảm bảo cả 2 format đều tồn tại
    fixedOrder.maVanDon = fixedOrder.maVanDon || fixedOrder.MaVanDon || `AUTO-${Date.now()}`;
    fixedOrder.MaVanDon = fixedOrder.MaVanDon || fixedOrder.maVanDon;
    
    // PHẦN 2: Chuẩn hoá định danh đơn hàng và khách hàng
    // -------------------------------------------------
    
    // Chuẩn hoá ID đơn hàng - hợp nhất các trường khác nhau
    fixedOrder.ID_DH = fixedOrder.ID_DH || fixedOrder.id || fixedOrder.orderId || fixedOrder.ID_DHT;
    fixedOrder.ID_DHT = fixedOrder.ID_DHT || fixedOrder.ID_DH || fixedOrder.id || fixedOrder.orderId;
    fixedOrder.id = fixedOrder.id || fixedOrder.ID_DH || fixedOrder.ID_DHT || fixedOrder.orderId;
    
    // Chuẩn hoá ID khách hàng - hợp nhất và đảm bảo tính nhất quán
    // Tìm ID_KH từ nhiều vị trí
    const customerId = 
      fixedOrder.ID_KH || 
      fixedOrder.khachHangId || 
      fixedOrder.userId || 
      fixedOrder.id_kh ||
      (fixedOrder.khachHang ? (fixedOrder.khachHang.id || fixedOrder.khachHang.ID_KH) : null) ||
      (fixedOrder.data ? (fixedOrder.data.ID_KH || fixedOrder.data.khachHangId || fixedOrder.data.userId) : null);
    
    if (customerId) {
      // Đảm bảo tất cả các trường đều có chung một ID khách hàng
      fixedOrder.ID_KH = customerId;
      fixedOrder.khachHangId = customerId;
      fixedOrder.userId = customerId;
      console.log(`Tìm thấy ID khách hàng: ${customerId}`);
    }
    
    // PHẦN 3: Chuẩn hoá thông tin khách hàng và người nhận
    // ---------------------------------------------------
    
    // Chuẩn hoá tên khách hàng
    const customerName = 
      fixedOrder.TenKhachHang || 
      fixedOrder.tenKhachHang || 
      (fixedOrder.khachHang ? (fixedOrder.khachHang.tenKhachHang || fixedOrder.khachHang.TenKhachHang || fixedOrder.khachHang.Ten_KH) : null) ||
      fixedOrder.Ten_KH;
    
    if (customerName) {
      fixedOrder.TenKhachHang = customerName;
      fixedOrder.tenKhachHang = customerName;
      fixedOrder.Ten_KH = customerName;
      console.log(`Tìm thấy tên khách hàng: ${customerName}`);
    } else {
      fixedOrder.TenKhachHang = "Chưa có thông tin";
      fixedOrder.tenKhachHang = "Chưa có thông tin";
      console.log("Không tìm thấy tên khách hàng trong đơn hàng");
    }
    
    // Chuẩn hoá thông tin người nhận
    const receiverName = 
      fixedOrder.TenNguoiNhan || 
      fixedOrder.tenNguoiNhan || 
      fixedOrder.Ten_NN || 
      fixedOrder.receiverName ||
      (fixedOrder.nguoiNhan ? (fixedOrder.nguoiNhan.ten || fixedOrder.nguoiNhan.Ten_NN || fixedOrder.nguoiNhan.tenNguoiNhan) : null);
    
    if (receiverName) {
      fixedOrder.TenNguoiNhan = receiverName;
      fixedOrder.tenNguoiNhan = receiverName; 
      fixedOrder.Ten_NN = receiverName;
      fixedOrder.receiverName = receiverName;
      console.log(`Tìm thấy tên người nhận: ${receiverName}`);
    }
    
    // PHẦN 4: Thêm metadata và hoàn thiện
    // ----------------------------------
    
    // Thêm các metadata hữu ích
    fixedOrder._normalized = true;
    fixedOrder._normalizedAt = new Date().toISOString();
    
    // Ghi log kết quả chuẩn hoá
    console.log("Kết quả chuẩn hoá:", {
      maVanDon: fixedOrder.maVanDon,
      ID_KH: fixedOrder.ID_KH,
      TenKhachHang: fixedOrder.TenKhachHang,
      Ten_NN: fixedOrder.Ten_NN
    });
    
    return fixedOrder;
  };

  // Improved function to save the order locally when connection fails
  const saveOrderLocallyIfNeeded = (order) => {
    try {
      // Get existing saved orders
      const savedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
      
      // Chuẩn hóa đơn hàng trước khi so sánh
      const normalizedOrder = normalizeOrderStructure(order);
      
      // Add this order if not already saved
      const orderExists = savedOrders.some(o => 
        (o.maVanDon === normalizedOrder.maVanDon || 
         o.MaVanDon === normalizedOrder.MaVanDon ||
         o.ID_DH === normalizedOrder.ID_DH ||
         o.id === normalizedOrder.id)
      );
      
      if (!orderExists) {
        // Add timestamp
        normalizedOrder._savedAt = new Date().toISOString();
        savedOrders.push(normalizedOrder);
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
        console.log("Đang trích xuất thông tin khách hàng từ đơn hàng:", order);        // NÂNG CẤP: Tìm ID khách hàng từ nhiều vị trí có thể có - thiết lập hàm tiện ích mở rộng
        const extractUserId = (obj) => {
          // Ghi log toàn bộ đối tượng để phân tích chi tiết
          console.log('Đang phân tích để tìm ID khách hàng từ:', JSON.stringify(obj, null, 2));
          
          // Tìm trong tất cả các thuộc tính có thể chứa ID khách hàng
          const possibleIdFields = [
            'ID_KH', 'id_kh', 'userId', 'khachHangId', 'customerID', 'customerId', 
            'idKhachHang', 'user_id', 'customer_id', 'UserID'
          ];
          
          // 1. Tìm trực tiếp ở cấp đầu tiên
          for (const field of possibleIdFields) {
            if (obj[field] !== undefined && obj[field] !== null) {
              console.log(`Tìm thấy ID khách hàng trong trường ${field}:`, obj[field]);
              return obj[field];
            }
          }
          
          // 2. Tìm trong các thuộc tính lồng nhau một cấp
          const nestedFields = [
            'data', 'khachHang', 'customer', 'orderData', 'info', 'donHang', 
            'donHangData', 'orderInfo', 'customerInfo', 'metaData', 'metadata'
          ];
          
          for (const nested of nestedFields) {
            if (obj[nested] && typeof obj[nested] === 'object') {
              for (const field of possibleIdFields) {
                if (obj[nested][field] !== undefined && obj[nested][field] !== null) {
                  console.log(`Tìm thấy ID khách hàng trong ${nested}.${field}:`, obj[nested][field]);
                  return obj[nested][field];
                }
              }
            }
          }
          
          // 3. Tìm trong các thuộc tính lồng nhau hai cấp
          for (const nested1 of nestedFields) {
            if (obj[nested1] && typeof obj[nested1] === 'object') {
              for (const nested2 of nestedFields) {
                if (obj[nested1][nested2] && typeof obj[nested1][nested2] === 'object') {
                  for (const field of possibleIdFields) {
                    if (obj[nested1][nested2][field] !== undefined && obj[nested1][nested2][field] !== null) {
                      console.log(`Tìm thấy ID khách hàng trong ${nested1}.${nested2}.${field}:`, obj[nested1][nested2][field]);
                      return obj[nested1][nested2][field];
                    }
                  }
                }
              }
            }
          }
          
          // 4. Nếu có khóa "id" và không có các khóa khác thường gặp, có thể đây là ID khách hàng
          if (obj.id && !obj.ID_DH && !obj.ID_DHT && !obj.MaVanDon && !obj.maVanDon) {
            console.log('Phát hiện ID có thể là ID khách hàng:', obj.id);
            return obj.id;
          }
          
          // 5. Tìm trong mảng như danh sách đơn hàng trước đó có cùng khách hàng
          if (Array.isArray(obj.orders) || Array.isArray(obj.donHang)) {
            const orders = obj.orders || obj.donHang || [];
            for (const order of orders) {
              const foundId = extractUserId(order); // Đệ quy tìm trong mỗi đơn hàng
              if (foundId) {
                console.log('Tìm thấy ID khách hàng từ đơn hàng trước:', foundId);
                return foundId;
              }
            }
          }
          
          console.log('Không tìm thấy ID khách hàng trong đối tượng');
          return null;
        };
        
        // Áp dụng hàm tiện ích để tìm kiếm ID
        let userId = extractUserId(order);
        
        // Kiểm tra đơn hàng từ bảng tạm trong DB MySQL
        if (!userId && order.ID_DHT) {
          console.log("Đơn hàng từ bảng tạm, đang tìm khachHangId từ ID_DHT:", order.ID_DHT);
          userId = order.ID_KH; // ID_KH trong DonHangTam
        }
        
        // Nếu order có chứa trường phẳng ID nhưng không có ID_KH, có thể đây là ID khách hàng
        if (!userId && order.id && !order.ID_DH && !order.ID_DHT) {
          console.log("Sử dụng trường id làm ID khách hàng:", order.id);
          userId = order.id;
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
            // Nếu vẫn không tìm thấy, thử các chiến lược khác
          if (!userId) {
            // Kiểm tra người nhận
            if (order.nguoiNhan && order.nguoiNhan.id) {
              console.log("Sử dụng ID người nhận thay thế:", order.nguoiNhan.id);
              userId = order.nguoiNhan.id; // Sử dụng ID người nhận thay thế
            } 
            // Kiểm tra theo số điện thoại
            else if (order.SdtKhachHang || order.SdtKH || order.SDT_KH || order.SDT) {
              // Lấy SDT để tìm kiếm
              const phone = order.SdtKhachHang || order.SdtKH || order.SDT_KH || order.SDT;
              console.log("Tìm kiếm theo SĐT:", phone);
              
              // Tìm trong các đơn hàng đã lưu
              const cachedOrders = JSON.parse(localStorage.getItem('pendingConfirmations') || '[]');
              const matchingOrder = cachedOrders.find(o => 
                (o.SdtKhachHang === phone || o.SdtKH === phone || o.SDT_KH === phone || o.SDT === phone) && 
                (o.ID_KH || o.userId || o.khachHangId)
              );
              
              if (matchingOrder) {
                userId = matchingOrder.ID_KH || matchingOrder.userId || matchingOrder.khachHangId;
                console.log("Tìm thấy ID khách hàng qua SĐT từ cache:", userId);
              }
            }
            
            // Nếu vẫn không tìm thấy, thông báo và tiếp tục
            if (!userId) {
              console.warn("Không tìm thấy ID khách hàng trong đơn hàng, sẽ gửi notification không kèm user ID");
              // Thử gửi thông báo chung cho tất cả khách hàng
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
            (order.data && order.data.paymentMethod === 'online');        // If we have a socket connection, try to send confirmation
        let confirmationSent = false;
        if (isConnected && socketService.socket) {
          // Log chi tiết để debug
          console.log("Thông tin đầy đủ của đơn hàng trước khi xác nhận:", {
            orderId, 
            userId, 
            isOnlinePayment,
            maVanDon: order.maVanDon || order.MaVanDon,
            tenKhachHang: order.tenKhachHang || order.TenKhachHang,
            receiverName: order.receiverName || order.Ten_NN || (order.nguoiNhan ? order.nguoiNhan.ten : null)
          });
            // Tạo bản sao chuẩn hóa cuối cùng của đơn hàng
          const normalizedOrder = normalizeOrderStructure(order);
            
          // Lấy thông tin người nhận từ đơn hàng
          const receiverId = order.nguoiNhan?.id;
          const receiverPhone = order.SdtNguoiNhan || order.Sdt_NN || (order.nguoiNhan && order.nguoiNhan.sdt);
          const receiverName = order.TenNguoiNhan || order.Ten_NN || (order.nguoiNhan && order.nguoiNhan.ten) || 'Người nhận';
          
          // Chuẩn bị thông tin người nhận cho thông báo
          const recipientInfo = {
            name: receiverName,
            phone: receiverPhone,
            orderCode: order.maVanDon || order.MaVanDon
          };
          
          // Gọi hàm xác nhận với dữ liệu đã xử lý - thêm một số trường giúp định danh
          confirmationSent = socketService.sendPaymentConfirmation(
            orderId, 
            userId, 
            isOnlinePayment,
            recipientInfo
          );

          // Tạo dữ liệu chi tiết để gửi
          const confirmationData = {
            // Thông tin định danh
            orderId,
            ID_DHT: orderId,
            ID_DH: orderId,
            orderKey: order.maVanDon || order.MaVanDon || orderId,
            
            // Thông tin khách hàng
            userId,
            ID_KH: userId,
            khachHangId: userId,
            TenKhachHang: normalizedOrder.TenKhachHang,
            tenKhachHang: normalizedOrder.TenKhachHang,
            
            // Thông tin người nhận
            receiverId,
            receiverPhone,
            receiverName,
            
            // Chi tiết đơn hàng
            orderData: normalizedOrder,
            maVanDon: normalizedOrder.maVanDon,
            MaVanDon: normalizedOrder.MaVanDon,
            
            // Thông tin xác nhận
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'admin',
            message: `Đơn hàng ${normalizedOrder.maVanDon || normalizedOrder.MaVanDon || orderId || "N/A"} đã được xác nhận!`
          };
          
          // Gửi thêm sự kiện xác nhận riêng cho staff với thông tin đơn hàng đầy đủ
          socketService.socket.emit('order:confirmed', confirmationData);
          
          // Gửi thông báo riêng cho người nhận nếu có
          if (receiverPhone) {
            console.log(`Gửi thông báo cho người nhận: ${receiverName} - SĐT: ${receiverPhone}`);
            socketService.socket.emit('send_notification', {
              to: 'sms_recipient',
              data: {
                type: 'order_confirmed_for_recipient',
                phone: receiverPhone,
                name: receiverName,
                message: `Đơn hàng ${normalizedOrder.maVanDon || normalizedOrder.MaVanDon} đã được xác nhận và sẽ sớm được giao tới quý khách.`,
                orderId: orderId,
                maVanDon: normalizedOrder.maVanDon || normalizedOrder.MaVanDon,
                timestamp: new Date().toISOString()
              }
            });
          }
          
          // Ghi log xác nhận thành công
          console.log("Đã gửi thông báo xác nhận đơn hàng:", {
            success: confirmationSent,
            orderId: orderId,
            userId: userId,
            maVanDon: normalizedOrder.maVanDon
          });
        }
          // Thông tin người nhận để hiển thị trong toast
        const hasRecipientContact = order.SdtNguoiNhan || order.Sdt_NN || (order.nguoiNhan && order.nguoiNhan.sdt);
        
        // Handle result
        if (confirmationSent) {
          if (isOnlinePayment) {
            toast.success(`Đã xác nhận thanh toán thành công và gửi thông báo cho người dùng!${
              hasRecipientContact ? ' Đã gửi thông báo cho người nhận.' : ''
            }`);
          } else {
            toast.success(`Đã xác nhận đơn hàng và gửi thông báo!${
              hasRecipientContact ? ' Người nhận cũng được thông báo.' : ''
            }`);
          }
        } else {
          // Save locally for retry if notification couldn't be sent
          saveOrderLocallyIfNeeded(order);
          
          if (!userId) {
            toast.warning("Không thể xác định người dùng, đơn hàng được xác nhận nhưng không thể gửi thông báo!");
          } else {
            toast.warning(`Đã xác nhận đơn hàng nhưng gặp vấn đề khi gửi thông báo!${
              hasRecipientContact ? ' Cần kiểm tra thông báo cho người nhận.' : ''
            }`);
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

  return (    <div className="pending-orders-alert">
      <div className="header-container">
        <h3>Đơn hàng mới chờ xác nhận: <span className="order-count">{pendingOrders.length}</span></h3>
        <div className="pending-instructions">Hiển thị mã vận đơn và ID khách hàng</div>
      </div>
      
      {pendingOrders.length === 0 ? (
        <div className="no-orders">Không có đơn hàng chờ xác nhận.</div>
      ) : (
        <ul className="orders-list">
          {pendingOrders.map((order, idx) => (<li
              key={`order-${order.maVanDon || order.MaVanDon || idx}-${idx}`}
              className="pending-order-item"
            >
              <span>
                <div className="simplified-order-summary">
                  <div className="main-info">
                    <span className="order-code">
                      <i className="fas fa-barcode"></i> 
                      <b>{order.maVanDon || order.MaVanDon || "N/A"}</b>
                    </span>
                    
                    <span className="customer-id-badge">
                      <i className="fas fa-user"></i> ID: {order.ID_KH || "Không xác định"}
                    </span>
                  </div>

                  <div className="order-actions">
                    <button
                      title="Xem thêm thông tin"
                      className="info-button"
                      onClick={() => {
                        alert(`Thông tin đầy đủ:
- Mã vận đơn: ${order.maVanDon || order.MaVanDon || "N/A"}
- ID đơn: ${order.ID_DHT || order.ID_DH || order.id || "N/A"}
- Khách hàng: ${order.TenKhachHang || order.tenKhachHang || "N/A"}
- Người nhận: ${order.TenNguoiNhan || order.Ten_NN || "N/A"}
- SĐT: ${order.SdtNguoiNhan || order.Sdt_NN || "N/A"}
- Thanh toán: ${order.paymentMethod === 'online' ? 'Chuyển khoản' : 'Tiền mặt'}`);
                      }}
                    >
                      <i className="fas fa-info-circle"></i>
                    </button>

                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmPendingOrder(order)}
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>                {/* Styles moved to imported CSS or inline styles */}
              </span>
            </li>
          ))}        </ul>
      )}
        {/* Styles moved to imported CSS */}
    </div>
  );
};

export default XacNhanDonHang;
