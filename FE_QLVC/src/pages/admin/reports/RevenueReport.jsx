import React, { useState, useEffect, useCallback,useMemo  } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// Import service để kết nối API
import { orderService } from '../../../services/orderService';
import './RevenueReport.css';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function RevenueReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    totalCodAmount: 0,
    totalShippingFee: 0
  });
  const [periodType, setPeriodType] = useState('month'); // 'month' hoặc 'year'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  // Tạo danh sách năm cho dropdown (5 năm gần nhất)
const years = useMemo(() => {
  return Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
}, []);
  // Hàm tạo dữ liệu mẫu - sẽ thay bằng API thực tế sau
  const generateMockData = useCallback(() => {
    let labels = [];
    let orderCounts = [];
    let codAmounts = [];
    let shippingFees = [];
    
    let totalOrders = 0;
    let totalCodAmount = 0;
    let totalShippingFee = 0;

    if (periodType === 'month') {
      // Dữ liệu theo tháng trong năm được chọn
      labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      
      for (let i = 0; i < 12; i++) {
        // Random số lượng đơn hàng từ 10-100
        const orderCount = Math.floor(Math.random() * 90) + 10;
        orderCounts.push(orderCount);
        totalOrders += orderCount;
        
        // Random tiền thu hộ từ 1-10 triệu
        const codAmount = Math.floor(Math.random() * 9000000) + 1000000;
        codAmounts.push(codAmount);
        totalCodAmount += codAmount;
        
        // Random phí giao hàng từ 0.5-2 triệu
        const shippingFee = Math.floor(Math.random() * 1500000) + 500000;
        shippingFees.push(shippingFee);
        totalShippingFee += shippingFee;
      }
    } else {
      // Dữ liệu theo năm (5 năm gần nhất)
      labels = years.map(year => year.toString()).reverse();
      
      for (let i = 0; i < 5; i++) {
        // Random số lượng đơn hàng từ 100-1000
        const orderCount = Math.floor(Math.random() * 900) + 100;
        orderCounts.push(orderCount);
        totalOrders += orderCount;
        
        // Random tiền thu hộ từ 10-100 triệu
        const codAmount = Math.floor(Math.random() * 90000000) + 10000000;
        codAmounts.push(codAmount);
        totalCodAmount += codAmount;
        
        // Random phí giao hàng từ 5-20 triệu
        const shippingFee = Math.floor(Math.random() * 15000000) + 5000000;
        shippingFees.push(shippingFee);
        totalShippingFee += shippingFee;
      }
    }

    return {
      labels,
      orderCounts,
      codAmounts,
      shippingFees,
      totalOrders,
      totalCodAmount,
      totalShippingFee
    };
  }, [periodType, years]);

  const prepareChartData = useCallback((data) => {
    setChartData({
      labels: data.labels,
      datasets: [
        {
          label: 'Tiền thu hộ (VNĐ)',
          data: data.codAmounts,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Tiền cước (VNĐ)',
          data: data.shippingFees,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Số lượng đơn',
          data: data.orderCounts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y1',
          tension: 0.1
        }
      ]
    });
  }, []);
  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi API để lấy dữ liệu thống kê thực tế
      const data = await orderService.getRevenueStats(periodType, selectedYear);
      
      // Cập nhật state với dữ liệu từ API
      setStatsData({
        totalOrders: data.totalOrders,
        totalCodAmount: data.totalCodAmount,
        totalShippingFee: data.totalShippingFee
      });

      // Chuẩn bị dữ liệu cho biểu đồ
      prepareChartData(data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
      setLoading(false);
        // Nếu API gặp lỗi, sẽ dùng dữ liệu mẫu trong môi trường phát triển
      if (import.meta.env.DEV) {
        console.log('Using mock data as fallback in development');
        const mockData = generateMockData();
        setStatsData({
          totalOrders: mockData.totalOrders,
          totalCodAmount: mockData.totalCodAmount,
          totalShippingFee: mockData.totalShippingFee
        });
        prepareChartData(mockData);
        setLoading(false);
        setError(null);
      }
    }
  }, [periodType, selectedYear, prepareChartData, generateMockData]);

  // useEffect với dependencies đã được sửa
  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: periodType === 'month' 
          ? `Thống kê doanh thu theo tháng năm ${selectedYear}` 
          : 'Thống kê doanh thu theo năm',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Doanh thu (VNĐ)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString('vi-VN') + ' đ';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Số đơn hàng'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const handlePeriodChange = (e) => {
    setPeriodType(e.target.value);
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu thống kê...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="revenue-report-container">
      <h1 className="revenue-report-title">Thống kê tiền hàng</h1>
      
      {/* Bộ lọc */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Hiển thị theo:</label>
          <select value={periodType} onChange={handlePeriodChange} className="filter-select">
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
        
        {periodType === 'month' && (
          <div className="filter-group">
            <label>Chọn năm:</label>
            <select value={selectedYear} onChange={handleYearChange} className="filter-select">
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
        
        <button 
          className="refresh-button"
          onClick={fetchRevenueData}
        >
          Làm mới
        </button>
      </div>
      
      {/* Các thẻ thống kê tổng quan */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon order-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-card-content">
            <h3 className="stat-card-title">Tổng số đơn hàng</h3>
            <p className="stat-card-value">{statsData.totalOrders.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon cod-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-card-content">
            <h3 className="stat-card-title">Tổng tiền thu hộ (COD)</h3>
            <p className="stat-card-value">{formatCurrency(statsData.totalCodAmount)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon fee-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div className="stat-card-content">
            <h3 className="stat-card-title">Tổng tiền cước</h3>
            <p className="stat-card-value">{formatCurrency(statsData.totalShippingFee)}</p>
          </div>
        </div>
      </div>
      
      {/* Biểu đồ */}
      <div className="chart-container">
        <Bar options={chartOptions} data={chartData} />
      </div>
      
      {/* Bảng dữ liệu chi tiết */}
      <div className="data-table-section">
        <h2 className="section-title">Dữ liệu chi tiết</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{periodType === 'month' ? 'Tháng' : 'Năm'}</th>
                <th>Số lượng đơn hàng</th>
                <th>Tiền thu hộ</th>
                <th>Tiền cước</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels && chartData.labels.map((label, index) => (
                <tr key={index}>
                  <td>{label}</td>
                  <td>{chartData.datasets[2]?.data[index]?.toLocaleString() || 0}</td>
                  <td>{formatCurrency(chartData.datasets[0]?.data[index] || 0)}</td>
                  <td>{formatCurrency(chartData.datasets[1]?.data[index] || 0)}</td>
                  <td>{formatCurrency((chartData.datasets[0]?.data[index] || 0) + (chartData.datasets[1]?.data[index] || 0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td><strong>Tổng cộng</strong></td>
                <td><strong>{statsData.totalOrders.toLocaleString()}</strong></td>
                <td><strong>{formatCurrency(statsData.totalCodAmount)}</strong></td>
                <td><strong>{formatCurrency(statsData.totalShippingFee)}</strong></td>
                <td><strong>{formatCurrency(statsData.totalCodAmount + statsData.totalShippingFee)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
