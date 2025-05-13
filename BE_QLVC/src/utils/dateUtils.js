/**
 * Utility functions for working with dates and timezones
 * Đảm bảo xử lý đúng múi giờ Việt Nam (UTC+7)
 */

/**
 * Format một date object thành chuỗi ngày tháng định dạng Việt Nam
 * @param {Date} date - Date object cần format
 * @param {boolean} includeTime - Có hiện thời gian hay không
 * @returns {string} - Chuỗi ngày tháng đã format
 */
function formatDateVN(date, includeTime = false) {
    if (!date) return '';
    
    try {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh' // Sử dụng múi giờ Việt Nam
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            options.hour12 = false;
        }
        
        return new Date(date).toLocaleString('vi-VN', options);
    } catch (err) {
        console.error('Error formatting date:', err);
        return String(date);
    }
}

/**
 * Chuyển đổi Date thành chuỗi timestamp cho MySQL với múi giờ Việt Nam
 * @param {Date} date - Date object
 * @returns {string} - Chuỗi timestamp MySQL
 */
function toMySQLTimestamp(date = new Date()) {
    if (!date) date = new Date();
    
    // Tạo một đối tượng date mới và điều chỉnh sang múi giờ Việt Nam
    const vnDate = new Date(date);
    // Không cần điều chỉnh 7 giờ vì MySQL connection đã có timezone: '+07:00'
    
    // Format theo định dạng YYYY-MM-DD HH:MM:SS mà MySQL chấp nhận
    const year = vnDate.getFullYear();
    const month = String(vnDate.getMonth() + 1).padStart(2, '0');
    const day = String(vnDate.getDate()).padStart(2, '0');
    const hours = String(vnDate.getHours()).padStart(2, '0');
    const minutes = String(vnDate.getMinutes()).padStart(2, '0');
    const seconds = String(vnDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Trả về chuỗi SQL để lấy thời gian hiện tại với múi giờ đúng
 * @returns {string} - Chuỗi SQL cho thời gian hiện tại
 */
function nowWithTimezone() {
    return "CONVERT_TZ(NOW(), @@session.time_zone, '+07:00')";
}

module.exports = {
    formatDateVN,
    toMySQLTimestamp,
    nowWithTimezone
};
