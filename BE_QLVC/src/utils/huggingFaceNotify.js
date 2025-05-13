// huggingFaceNotify.js
const axios = require('axios');
require('dotenv').config();
const { formatDateVN } = require('./dateUtils');

const HF_API_KEY = process.env.HF_API_KEY;
// Sử dụng model phổ biến của Hugging Face cho tiếng Việt
const HF_MODEL = 'vinai/phobert-base'; // Model tiếng Việt phù hợp hơn

/**
 * Sinh thông báo tự động khi đơn hàng giao trễ bằng Hugging Face Inference API
 * @param {Object} order - Thông tin đơn hàng
 * @returns {Promise<string>} - Thông báo sinh ra từ AI
 */
async function generateLateDeliveryMessageHF(order) {
  try {
    // Sử dụng một thông báo chuyên nghiệp với các thông tin cần thiết
    // Thay vì dùng model để sinh nội dung (vì APIs khác nhau có thể không nhất quán),
    // chúng ta sẽ dùng template có sẵn và điền thông tin vào
      console.log('Tạo thông báo giao hàng trễ cho đơn hàng:', order.MaVanDon || order.ID_DH);
    
    // Lấy thời gian hiện tại theo múi giờ Việt Nam sử dụng hàm tiện ích
    const formattedTime = formatDateVN(new Date(), true);
      // Tạo thông báo với template ngắn gọn để đảm bảo không vượt quá giới hạn của cột NoiDung
    const message = `[THÔNG BÁO TRỄ] Đơn hàng ${order.MaVanDon || order.orderCode || order.ID_DH} đã trễ hẹn giao.
Khách hàng: ${order.TenKhachHang || 'KH'}
Ngày giao dự kiến: ${order.NgayGiaoDuKien ? new Date(order.NgayGiaoDuKien).toLocaleDateString('vi-VN') : 'N/A'}
Nhân viên cần hoàn thành đơn hàng.`;

    return message;  } catch (err) {    console.error('Lỗi khi tạo thông báo:', err.message);
      // Lấy thời gian hiện tại theo múi giờ Việt Nam sử dụng hàm tiện ích
    const formattedTime = formatDateVN(new Date(), true);
    
    // Trả về thông báo mặc định ngắn gọn để tránh lỗi cột NoiDung quá dài
    const defaultMessage = `[THÔNG BÁO] Đơn hàng ${order.MaVanDon || order.ID_DH} đã trễ hẹn giao. 
Xin lỗi ${order.TenKhachHang || 'Quý khách'} vì sự bất tiện này.`;
    
    console.log('Sử dụng thông báo mặc định:', defaultMessage);
    return defaultMessage;
  }
}

module.exports = { generateLateDeliveryMessageHF };
