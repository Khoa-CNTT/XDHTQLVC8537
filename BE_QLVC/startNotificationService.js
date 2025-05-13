// startNotificationService.js
const { spawn } = require('child_process');
const path = require('path');

/**
 * Khởi động dịch vụ thông báo đơn hàng tự động
 */
function startNotificationService() {
  console.log('Đang khởi động dịch vụ thông báo đơn hàng tự động...');
  
  const scriptPath = path.join(__dirname, 'scheduleNotifications.js');
  
  // Spawn một child process để chạy script
  const child = spawn('node', [scriptPath], {
    detached: true, // Tách process con khỏi process cha
    stdio: 'inherit' // Sử dụng cùng stdio với process cha
  });
  
  child.on('error', (err) => {
    console.error('Không thể khởi động dịch vụ:', err);
  });
  
  // Unref() cho phép process cha thoát ngay cả khi process con vẫn đang chạy
  child.unref();
  
  console.log('Dịch vụ thông báo đơn hàng đã được khởi động!');
  console.log('Bạn có thể đóng terminal này, dịch vụ sẽ tiếp tục chạy trong nền.');
}

// Khởi động dịch vụ
startNotificationService();
