// scheduleNotifications.js
const { exec } = require('child_process');
const path = require('path');

// Thời gian kiểm tra định kỳ (tính bằng phút)
const NOTIFICATION_CHECK_INTERVAL = 60; // Kiểm tra mỗi 1 giờ

/**
 * Chạy script kiểm tra đơn hàng trễ
 */
function runLateOrdersCheck() {
  console.log(`[${new Date().toLocaleString('vi-VN')}] Bắt đầu kiểm tra đơn hàng trễ và sắp đến hạn giao...`);
  
  const scriptPath = path.join(__dirname, 'notifyLateOrders.js');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Lỗi khi chạy script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Lỗi: ${stderr}`);
      return;
    }
    
    console.log(`Kết quả kiểm tra:\n${stdout}`);
    console.log(`[${new Date().toLocaleString('vi-VN')}] Hoàn thành kiểm tra đơn hàng trễ và sắp đến hạn giao`);
    console.log(`Lần kiểm tra tiếp theo sẽ diễn ra sau ${NOTIFICATION_CHECK_INTERVAL} phút\n`);
  });
}

// Chạy ngay lần đầu khi khởi động script
runLateOrdersCheck();

// Lên lịch chạy định kỳ
console.log(`Đã thiết lập lịch kiểm tra đơn hàng trễ và sắp đến hạn giao mỗi ${NOTIFICATION_CHECK_INTERVAL} phút`);
setInterval(runLateOrdersCheck, NOTIFICATION_CHECK_INTERVAL * 60 * 1000);

console.log('Hệ thống kiểm tra đơn hàng tự động đã khởi động...');
console.log(`Thời gian hiện tại: ${new Date().toLocaleString('vi-VN')}`);
