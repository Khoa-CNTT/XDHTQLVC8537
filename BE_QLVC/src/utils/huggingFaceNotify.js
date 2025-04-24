// huggingFaceNotify.js
const axios = require('axios');
require('dotenv').config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = 'google/flan-t5-base'; // Model miễn phí, trả về nhanh hơn

/**
 * Sinh thông báo tự động khi đơn hàng giao trễ bằng Hugging Face Inference API
 * @param {Object} order - Thông tin đơn hàng
 * @returns {Promise<string>} - Thông báo sinh ra từ AI
 */
async function generateLateDeliveryMessageHF(order) {
  const prompt = `Bạn là hệ thống thông báo tự động. Hãy tạo một thông báo lịch sự, chuyên nghiệp bằng tiếng Việt cho nhân viên giao hàng về việc đơn hàng có mã vận đơn ${order.MaVanDon || order.orderCode || order.ID_DH} đã bị giao trễ. Thông tin khách hàng: ${order.TenKhachHang || 'Không rõ'}, địa chỉ: ${order.DiaChiNN || 'Không rõ'}.`;
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    // Tùy model, response có thể khác nhau
    if (response.data && Array.isArray(response.data) && response.data[0]?.generated_text) {
      return response.data[0].generated_text.trim();
    }
    if (response.data?.generated_text) {
      return response.data.generated_text.trim();
    }
    // Fallback
    return JSON.stringify(response.data);
  } catch (err) {
    console.error('Lỗi khi gọi Hugging Face Inference API:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { generateLateDeliveryMessageHF };
