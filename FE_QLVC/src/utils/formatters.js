/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi đã định dạng, ví dụ: "100.000 ₫"
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Định dạng ngày tháng theo chuẩn Việt Nam
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi ngày đã định dạng, ví dụ: "22/04/2023"
 */
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
};
