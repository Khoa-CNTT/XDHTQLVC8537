import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Biến API_URL cho các API calls bình thường
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  }
  setupSocketListeners() {
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
        console.log(`Received ${event} event:`, data);
        
        // Gọi các callback đã đăng ký cho event này
        const eventName = this.getCallbackName(event);
        if (this.callbacks[eventName]) {
          this.callbacks[eventName].forEach(callback => callback(data));
        }

        // Hiển thị thông báo toast nếu có message
        if (data.message) {
          toast.info(data.message);
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

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
