import axios from '../utils/axios';

// Mock data for financial reports (use only when API fails)
const mockFinancialReports = [
  {
    ID_BCTC: 1,
    TenQL: 'Admin',
    NgayBatDau: '2023-11-01',
    NgayKetThuc: '2023-11-30',
    TienShip: 5000000,
    TienThuHo: 12000000,
    DoanhThu: 6000000,
    Loai_BC: 'Tài chính hàng tháng'
  },
  {
    ID_BCTC: 2,
    TenQL: 'Admin',
    NgayBatDau: '2023-10-01',
    NgayKetThuc: '2023-10-31',
    TienShip: 4500000,
    TienThuHo: 10000000,
    DoanhThu: 5200000,
    Loai_BC: 'Tài chính hàng tháng'
  }
];

// Mock data for staff reports (use only when API fails)
const mockStaffReports = [
  {
    ID_BCNV: 1,
    ID_NV: 101,
    Ten_NV: "Nguyễn Văn A",
    NgayBaoCao: "2023-11-15",
    SoDonGiao: 25,
    SoDonTre: 2,
    DanhGiaHieuSuat: "Tốt",
    Loai_BC: "Báo cáo nhân viên hàng tháng"
  },
  {
    ID_BCNV: 2,
    ID_NV: 102,
    Ten_NV: "Trần Thị B",
    NgayBaoCao: "2023-11-15",
    SoDonGiao: 18,
    SoDonTre: 5,
    DanhGiaHieuSuat: "Trung bình",
    Loai_BC: "Báo cáo nhân viên hàng tháng"
  }
];

/**
 * ===== BÁO CÁO TÀI CHÍNH =====
 */

/**
 * Lấy tất cả báo cáo tài chính
 * @returns {Promise} Promise trả về danh sách báo cáo tài chính
 */
export const getAllFinancialReports = async () => {
  try {    // Use the correct endpoint matching the backend route
    const possibleEndpoints = [
      '/financial-reports'
    ];
    
    let response = null;
    let lastError = null;
    
    // Try each endpoint until one works
    for (let endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        response = await axios.get(endpoint);
        if (response && response.data && response.data.data) {
          console.log(`Success with endpoint: ${endpoint}`);
          return response.data;
        }
      } catch (err) {
        console.log(`Endpoint ${endpoint} failed: ${err.message}`);
        lastError = err;
        continue; // Try next endpoint
      }
    }
    
    // If we get here, all endpoints failed
    console.error('All endpoints failed. Last error:', lastError);
    
    // If all API calls fail, use mock data
    console.warn('All API endpoints failed. Using mock data.');
    return { 
      success: true, 
      data: mockFinancialReports,
      message: 'Mock data is being displayed because API is unavailable'
    };
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách báo cáo tài chính:', error);
    // Log additional error details
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    
    // Return mock data as fallback
    console.warn('Returning mock data due to API error');
    return { 
      success: true, 
      data: mockFinancialReports,
      message: 'Mock data is being displayed because API is unavailable'
    };
  }
};

/**
 * Lấy báo cáo tài chính theo ID
 * @param {number} id ID của báo cáo tài chính
 * @returns {Promise} Promise trả về báo cáo tài chính
 */
export const getFinancialReportById = async (id) => {
  try {
    const response = await axios.get(`/financial-reports/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy báo cáo tài chính ID=${id}:`, error);
    throw error;
  }
};

/**
 * Lấy báo cáo tài chính theo khoảng thời gian
 * @param {string} startDate Ngày bắt đầu (định dạng YYYY-MM-DD)
 * @param {string} endDate Ngày kết thúc (định dạng YYYY-MM-DD)
 * @returns {Promise} Promise trả về danh sách báo cáo tài chính
 */
export const getFinancialReportsByDateRange = async (startDate, endDate) => {
  try {
    const response = await axios.get(`/financial-reports/date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo tài chính theo khoảng thời gian:', error);
    throw error;
  }
};

/**
 * Lấy thống kê doanh thu
 * @param {string} period Phân kỳ ('day', 'month', 'year')
 * @param {string} startDate Ngày bắt đầu (định dạng YYYY-MM-DD)
 * @param {string} endDate Ngày kết thúc (định dạng YYYY-MM-DD)
 * @returns {Promise} Promise trả về dữ liệu thống kê doanh thu
 */
export const getRevenueStatistics = async (period, startDate, endDate) => {
  try {
    const response = await axios.get(
      `/financial-reports/revenue-statistics?period=${period}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thống kê doanh thu:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo tài chính mới
 * @param {Object} reportData Dữ liệu báo cáo tài chính
 * @returns {Promise} Promise trả về báo cáo tài chính đã tạo
 */
export const createFinancialReport = async (reportData) => {
  try {
    const response = await axios.post('/financial-reports', reportData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo tài chính mới:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo tài chính tự động dựa trên dữ liệu đơn hàng
 * @param {Object} data Dữ liệu yêu cầu (ID_QL, startDate, endDate)
 * @returns {Promise} Promise trả về báo cáo tài chính đã tạo
 */
export const generateAutomaticFinancialReport = async (data) => {
  try {
    const response = await axios.post('/financial-reports/generate-automatic', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo tài chính tự động:', error);
    throw error;
  }
};

/**
 * Cập nhật báo cáo tài chính
 * @param {number} id ID của báo cáo tài chính
 * @param {Object} reportData Dữ liệu cập nhật
 * @returns {Promise} Promise trả về kết quả cập nhật
 */
export const updateFinancialReport = async (id, reportData) => {
  try {
    const response = await axios.put(`/financial-reports/${id}`, reportData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật báo cáo tài chính ID=${id}:`, error);
    throw error;
  }
};

/**
 * Xóa báo cáo tài chính
 * @param {number} id ID của báo cáo tài chính
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteFinancialReport = async (id) => {
  try {
    const response = await axios.delete(`/financial-reports/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa báo cáo tài chính ID=${id}:`, error);
    throw error;
  }
};

/**
 * ===== BÁO CÁO NHÂN VIÊN =====
 */

/**
 * Lấy tất cả báo cáo nhân viên
 * @returns {Promise} Promise trả về danh sách báo cáo nhân viên
 */
export const getAllStaffReports = async () => {
  try {    // Use the correct endpoint matching the backend route
    const possibleEndpoints = [
      '/staff-reports'
    ];
    
    let response = null;
    let lastError = null;
    
    // Try each endpoint until one works
    for (let endpoint of possibleEndpoints) {
      try {
        console.log(`Trying staff reports endpoint: ${endpoint}`);
        response = await axios.get(endpoint);
        if (response && response.data && response.data.data) {
          console.log(`Success with staff reports endpoint: ${endpoint}`);
          return response.data;
        }
      } catch (err) {
        console.log(`Endpoint ${endpoint} failed: ${err.message}`);
        lastError = err;
        continue; // Try next endpoint
      }
    }
    
    // If we get here, all endpoints failed
    console.error('All staff endpoints failed. Last error:', lastError);
    
    // If all API calls fail, use mock data
    console.warn('All staff reports API endpoints failed. Using mock data.');
    return { 
      success: true, 
      data: mockStaffReports,
      message: 'Mock data is being displayed because API is unavailable'
    };
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách báo cáo nhân viên:', error);
    // Log additional error details
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    
    // Return mock data as fallback
    console.warn('Returning mock data due to API error');
    return { 
      success: true, 
      data: mockStaffReports,
      message: 'Mock data is being displayed because API is unavailable'
    };
  }
};

/**
 * Lấy báo cáo nhân viên theo ID
 * @param {number} id ID của báo cáo nhân viên
 * @returns {Promise} Promise trả về báo cáo nhân viên
 */
export const getStaffReportById = async (id) => {
  try {
    const response = await axios.get(`/staff-reports/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy báo cáo nhân viên ID=${id}:`, error);
    throw error;
  }
};

/**
 * Lấy báo cáo nhân viên theo khoảng thời gian
 * @param {string} startDate Ngày bắt đầu (định dạng YYYY-MM-DD)
 * @param {string} endDate Ngày kết thúc (định dạng YYYY-MM-DD)
 * @returns {Promise} Promise trả về danh sách báo cáo nhân viên
 */
export const getStaffReportsByDateRange = async (startDate, endDate) => {
  try {
    const response = await axios.get(`/staff-reports/by-date?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo nhân viên theo khoảng thời gian:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo nhân viên theo nhân viên cụ thể
 * @param {number} staffId ID của nhân viên
 * @returns {Promise} Promise trả về danh sách báo cáo nhân viên
 */
export const getStaffReportsByStaffId = async (staffId) => {
  try {
    const response = await axios.get(`/staff-reports/staff/${staffId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy báo cáo của nhân viên ID=${staffId}:`, error);
    throw error;
  }
};

/**
 * Tạo báo cáo nhân viên mới
 * @param {Object} reportData Dữ liệu báo cáo nhân viên
 * @returns {Promise} Promise trả về báo cáo nhân viên đã tạo
 */
export const createStaffReport = async (reportData) => {
  try {
    const response = await axios.post('/staff-reports', reportData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo nhân viên mới:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo nhân viên tự động dựa trên dữ liệu đơn hàng
 * @param {Object} data Dữ liệu yêu cầu (ID_QL, ID_NV, startDate, endDate)
 * @returns {Promise} Promise trả về báo cáo nhân viên đã tạo
 */
export const generateAutomaticStaffReport = async (data) => {
  console.log("Generating automatic staff report with data:", data);
  try {
    const response = await axios.post('/staff-reports/generate-automatic', data);
    console.log("Automatic report generation successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in generateAutomaticStaffReport:", error);
    // Re-throw the error so it can be caught by the caller
    throw error;
  }
};

/**
 * Cập nhật báo cáo nhân viên
 * @param {number} id ID của báo cáo nhân viên
 * @param {Object} reportData Dữ liệu cập nhật
 * @returns {Promise} Promise trả về kết quả cập nhật
 */
export const updateStaffReport = async (id, reportData) => {
  try {
    const response = await axios.put(`/staff-reports/${id}`, reportData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật báo cáo nhân viên ID=${id}:`, error);
    throw error;
  }
};

/**
 * Xóa báo cáo nhân viên
 * @param {number} id ID của báo cáo nhân viên
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteStaffReport = async (id) => {
  try {
    const response = await axios.delete(`/staff-reports/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa báo cáo nhân viên ID=${id}:`, error);
    throw error;
  }
};
