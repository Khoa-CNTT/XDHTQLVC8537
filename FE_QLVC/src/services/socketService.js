import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Biến API_URL cho các API calls bình thường
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Socket server luôn chạy ở root path, không phải /api
const SOCKET_SERVER_URL = API_URL.includes('/api') 
  ? API_URL.split('/api')[0]  // Loại bỏ /api nếu có
  : API_URL;

class SocketService {
  socket = null;
  callbacks = {
    newOrder: [],
    orderAccepted: [],
    orderStatusChanged: [],
    orderCanceled: [],
    notification: []
  };  connect(userId, userRole) {
    if (this.socket && this.socket.connected) return;
    
    // Kết nối với socket server URL (không bao gồm /api)
    this.socket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: false, // Thay đổi thành false để tránh vấn đề CORS
      transports: ['websocket', 'polling'], // Thử kết nối WebSocket trước, sau đó dùng polling
    });

    this.setupSocketListeners();

    this.socket.on('connect', () => {
      console.log('Connected to socket server with ID:', this.socket.id);

      // Đăng ký vào room dựa trên vai trò
      if (userRole) {
        this.socket.emit('joinRoom', userRole);
      }

      // Nếu là khách hàng, đăng ký vào room cá nhân
      if (userRole === 'customer' && userId) {
        this.socket.emit('joinRoom', `customer_${userId}`);
      } else if (userRole === 'staff' || userRole === 'admin') {
        this.socket.emit('joinRoom', 'staff');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Không thể kết nối với máy chủ thông báo');
    });
  }  setupSocketListeners() {
    const events = [
      'new_order',
      'order_accepted',
      'order_status_changed',
      'order_canceled',
      'notification',
      'order:update'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        // console.log(`Received ${event} event:`, data);
        
        // Gọi các callback đã đăng ký cho event này
        const eventName = this.getCallbackName(event);
        if (this.callbacks[eventName]) {
          this.callbacks[eventName].forEach(callback => callback(data));
        }

        // Hiển thị thông báo toast nếu có message
        if (data.message) {
          if (data.type === 'congratulation') {
            // Hiển thị thông báo chúc mừng với style đặc biệt
            toast.success(data.message, {
              icon: data.icon || "🎉",
              autoClose: 8000,  // Thời gian hiển thị lâu hơn (8 giây)
              className: 'congratulation-toast'
            });
          } else if (data.priority === 'high') {
            // Thông báo quan trọng
            toast.error(data.message, { autoClose: 6000 });
          } else if (data.priority === 'medium') {
            // Thông báo mức độ trung bình
            toast.warning(data.message);
          } else {
            // Thông báo thông thường
            toast.info(data.message);
          }
        }
      });
    });
  }

  getCallbackName(event) {
    switch(event) {
      case 'new_order': return 'newOrder';
      case 'order_accepted': return 'orderAccepted';
      case 'order_status_changed': return 'orderStatusChanged';
      case 'order_canceled': return 'orderCanceled';
      case 'notification': return 'notification';
      default: return event;
    }
  }

  // Đăng ký callback cho sự kiện đơn hàng mới
  onNewOrder(callback) {
    if (typeof callback === 'function') {
      this.callbacks.newOrder.push(callback);
    }
    return () => {
      this.callbacks.newOrder = this.callbacks.newOrder.filter(cb => cb !== callback);
    };
  }

  // Đăng ký callback cho sự kiện đơn hàng được tiếp nhận
  onOrderAccepted(callback) {
    if (typeof callback === 'function') {
      this.callbacks.orderAccepted.push(callback);
    }
    return () => {
      this.callbacks.orderAccepted = this.callbacks.orderAccepted.filter(cb => cb !== callback);
    };
  }

  // Đăng ký callback cho sự kiện trạng thái đơn hàng thay đổi
  onOrderStatusChanged(callback) {
    if (typeof callback === 'function') {
      this.callbacks.orderStatusChanged.push(callback);
    }
    return () => {
      this.callbacks.orderStatusChanged = this.callbacks.orderStatusChanged.filter(cb => cb !== callback);
    };
  }

  // Đăng ký callback cho sự kiện đơn hàng bị hủy
  onOrderCanceled(callback) {
    if (typeof callback === 'function') {
      this.callbacks.orderCanceled.push(callback);
    }
    return () => {
      this.callbacks.orderCanceled = this.callbacks.orderCanceled.filter(cb => cb !== callback);
    };
  }
  // Đăng ký callback cho sự kiện thông báo chung
  onNotification(callback) {
    if (typeof callback === 'function') {
      this.callbacks.notification.push(callback);
    }
    return () => {
      this.callbacks.notification = this.callbacks.notification.filter(cb => cb !== callback);
    };
  }

  // Đăng ký callback cho sự kiện thông báo mới
  onNewNotification(callback) {
    if (typeof callback === 'function') {
      this.callbacks.notification.push(callback);
    }
    return () => {
      this.callbacks.notification = this.callbacks.notification.filter(cb => cb !== callback);
    };
  }

  // Hủy đăng ký callback cho sự kiện thông báo mới
  offNewNotification(callback) {
    if (typeof callback === 'function') {
      this.callbacks.notification = this.callbacks.notification.filter(cb => cb !== callback);
    }
  }

  // Add a new handler for order confirmation
  onOrderConfirmed(callback) {
    if (this.socket) {
      this.socket.on('order:confirmed', (data) => {
        console.log('Socket received order:confirmed event:', data);
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      });
      
      return () => {
        this.socket.off('order:confirmed');
      };
    } else {
      console.error('Socket is not connected. Cannot register onOrderConfirmed handler.');
      return () => {};
    }
  }

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }  // Gửi thông báo xác nhận thanh toán thành công
  sendPaymentConfirmation(orderId, userId, isOnlinePayment = false, recipientInfo = null) {
    // Enhanced validation
    if (!orderId) {
      console.error("Cannot send payment confirmation: Missing orderId");
      return false;
    }
    
    // Prepare notification data
    const eventData = {
      type: isOnlinePayment ? 'payment_confirmed' : 'order_confirmed',
      title: isOnlinePayment 
        ? 'Xác nhận thanh toán' 
        : 'Xác nhận đơn hàng',
      message: isOnlinePayment 
        ? 'Thanh toán của bạn đã được xác nhận. Đơn hàng đang được xử lý.' 
        : 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.',
      orderId: orderId,
      timestamp: new Date().toISOString(),
      data: { orderId, isOnlinePayment }
    };
      // Có userId thì gửi thông báo đến người dùng cụ thể, không có thì chỉ gửi thông báo chung
    if (!userId) {
      console.warn("Missing userId for notification - will send broadcast confirmation");
    }
    
    if (this.socket && this.socket.connected) {
      try {
        if (userId) {
          // Gửi thông báo tới khách hàng cụ thể
          this.socket.emit('send_notification', {
            to: `customer_${userId}`,
            data: eventData
          });
          console.log(`Đã gửi thông báo tới customer_${userId}`);
        } else {
          // Gửi thông báo broadcast nếu không có userId
          this.socket.emit('send_notification', {
            to: 'customers', // Room chung cho tất cả khách hàng
            data: {
              ...eventData,
              broadcast: true // Đánh dấu là thông báo chung
            }
          });
          console.log('Đã gửi thông báo broadcast tới tất cả khách hàng');
        }
        
        // Nếu có thông tin người nhận, gửi thêm thông báo cho họ
        if (recipientInfo && recipientInfo.phone) {
          this.socket.emit('send_sms_notification', {
            phone: recipientInfo.phone,
            name: recipientInfo.name || 'Quý khách',
            message: `Đơn hàng ${recipientInfo.orderCode || ''} đã được xác nhận và sẽ sớm được giao tới quý khách.`,
            orderId: orderId
          });
          
          console.log(`Đã gửi thông báo SMS tới người nhận: ${recipientInfo.phone}`);
        }
          // Also emit the confirmation event with improved data
        this.socket.emit('order:confirmed', {
          orderId,
          userId: userId || null, // Explicitly set null if missing
          isOnlinePayment,
          confirmedAt: new Date().toISOString(),
          confirmedBy: 'admin',
          // Include additional orderId formats to help client-side matching
          orderIdAlternatives: {
            maVanDon: typeof orderId === 'string' ? orderId : null,
            id: typeof orderId === 'number' ? orderId : null
          }
        });
        
        console.log(`Notification sent to customer_${userId} about order ${orderId}`);
        return true;
      } catch (err) {
        console.error("Error sending notification:", err);
        return false;
      }
    } else {
      console.warn("Socket not connected. Cannot send notification.");
      return false;
    }
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
