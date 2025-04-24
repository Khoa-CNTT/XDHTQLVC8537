import React, { useState, useEffect } from 'react';
import './OrderManagement.css';
import { orderService } from '../../services/orderService';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all'); // all, received, picking, picked, failedPick, delivering, delivering, delivered, failedDelivery, overdue, cancelled, returned
  const [payerFilter, setPayerFilter] = useState('all'); // all, sender, receiver
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // all, noCOD, waitingCOD, receivedCOD  // Date range functionality has been removed
  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Use the getOrders method from orderService      
      const orderData = await orderService.getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payer: payerFilter !== 'all' ? payerFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined
      });
      
      // Filter orders based on code/name if orderFilter is provided
      const filteredData = orderFilter 
        ? orderData.filter(order => 
            (order.MaVanDon || '').toLowerCase().includes(orderFilter.toLowerCase()) ||
            (order.NguoiGui?.HoTen || '').toLowerCase().includes(orderFilter.toLowerCase()) ||
            (order.NguoiNhan?.HoTen || '').toLowerCase().includes(orderFilter.toLowerCase())
          )
        : orderData;
      
      // Apply pagination to the filtered data
      const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      );
      
      setOrders(paginatedData);
      
      // Calculate total pages based on filtered data length
      const total = Math.ceil(filteredData.length / rowsPerPage) || 1;
      setTotalPages(total);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Không thể tải dữ liệu vận đơn. Vui lòng thử lại sau.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };  // Call fetchOrders when component mounts or dependencies change
  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, orderFilter, statusFilter, payerFilter, paymentStatusFilter]);
    // Lắng nghe sự kiện socket.io để cập nhật đơn hàng theo thời gian thực
  useEffect(() => {
    // Lắng nghe khi có đơn hàng mới
    const unsubNewOrder = socketService.onNewOrder((data) => {
      console.log('Admin nhận được sự kiện đơn hàng mới:', data);
      toast.info(`Đơn hàng mới ${data.maVanDon} vừa được tạo!`);
      fetchOrders();
    });
    
    // Lắng nghe khi có đơn hàng được tiếp nhận
    const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
      console.log('Admin nhận được sự kiện đơn hàng được tiếp nhận:', data);
      toast.info(`Đơn hàng ${data.maVanDon} đã được nhân viên tiếp nhận!`);
      fetchOrders();
    });
    
    // Lắng nghe khi trạng thái đơn hàng thay đổi
    const unsubOrderStatusChanged = socketService.onOrderStatusChanged((data) => {
      console.log('Admin nhận được sự kiện trạng thái đơn hàng thay đổi:', data);
      toast.info(`Đơn hàng ${data.maVanDon} đã được cập nhật: ${data.newStatus}`);
      fetchOrders();
    });

    // Lắng nghe khi đơn hàng bị hủy
    const unsubOrderCanceled = socketService.onOrderCanceled((data) => {
      console.log('Admin nhận được sự kiện đơn hàng bị hủy:', data);
      toast.warning(`Đơn hàng ${data.maVanDon} đã bị hủy. Lý do: ${data.reason || 'Không có lý do'}`);
      fetchOrders();
    });
    
    // Hủy đăng ký lắng nghe khi component unmount
    return () => {
      unsubNewOrder();
      unsubOrderAccepted();
      unsubOrderStatusChanged();
      unsubOrderCanceled();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* fetchOrders được gọi trong callback, nhưng thêm vào dependency sẽ gây re-render liên tục */]);

  // Handle approve action
  const handleApprove = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt đơn hàng này?')) {
      try {
        await orderService.approveOrder(orderId);
        // Refresh the order list
        fetchOrders();
        alert('Duyệt đơn hàng thành công!');
      } catch (err) {
        console.error('Failed to approve order:', err);
        alert('Không thể duyệt đơn hàng. Vui lòng thử lại sau.');
      }
    }
  };
  
  // Handle cancel action
  const handleCancel = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn huỷ đơn hàng này?')) {
      try {
        await orderService.cancelOrder(orderId);
        // Refresh the order list
        fetchOrders();
        alert('Huỷ đơn hàng thành công!');
      } catch (err) {
        console.error('Failed to cancel order:', err);
        alert('Không thể huỷ đơn hàng. Vui lòng thử lại sau.');
      }
    }
  };
  
  // Handle print order
  const handlePrintOrder = (orderId) => {
    // Implement print functionality
    console.log('Print order:', orderId);
    alert('Chức năng in đơn đang được phát triển');
  };
  
  // Handle export to Excel
  const handleExportExcel = () => {
    // Implement export functionality
    console.log('Export orders to Excel');
    alert('Chức năng xuất Excel đang được phát triển');
  };
  
  // Handle search with debounce
  const handleSearchChange = (e) => {
    setOrderFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle payer filter change
  const handlePayerFilterChange = (e) => {
    setPayerFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle payment status filter change
  const handlePaymentStatusFilterChange = (e) => {
    setPaymentStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };
    // Date range functionality has been removed
  
  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
    // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = Number(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' đ';
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalOrders = orders.length;
    let totalCOD = orders.reduce((sum, order) => sum + (order.ThuHo || 0), 0);
    let totalShippingFee = orders.reduce((sum, order) => sum + (order.TongCuoc || 0), 0);
    
    return {
      totalOrders,
      totalCOD: formatCurrency(totalCOD),
      totalShippingFee: formatCurrency(totalShippingFee)
    };
  };

  const totals = calculateTotals();
  // Status tab options
  const statusTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Đã tiếp nhận', label: 'Đã tiếp nhận' },
    { id: 'Đang lấy', label: 'Đang lấy' },
    { id: 'Đã lấy', label: 'Đã lấy' },
    { id: 'Lấy thất bại', label: 'Lấy thất bại' },
    { id: 'Đang vận chuyển', label: 'Đang vận chuyển' },
    { id: 'Đang giao', label: 'Đang giao' },
    { id: 'Đã giao', label: 'Đã giao' },
    { id: 'Giao thất bại', label: 'Giao thất bại' },
    { id: 'Quá hạn giao', label: 'Quá hạn giao' },
    { id: 'Huỷ giao', label: 'Huỷ giao' },
    { id: 'Đã Hoàn', label: 'Đã Hoàn' }
  ];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}\n${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  };

  return (
    <div className="order-management-container">
      <h1 className="order-management-title">Quản lý vận đơn</h1>
      
      {/* Filters and tabs */}
      <div className="order-management-filters">
        <div className="search-container">
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Tìm đơn hàng"
              className="search-input"
              value={orderFilter}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="filter-selects">
          <div className="select-wrapper">
            <select 
              value={payerFilter} 
              onChange={(e) => handlePayerFilterChange(e)}
              className="filter-select"
            >
              <option value="all">Nguời trả cước: Tất cả</option>
              <option value="sender">Người gửi</option>
              <option value="receiver">Người nhận</option>
            </select>
          </div>
          
          <div className="select-wrapper">
            <select 
              value={paymentStatusFilter} 
              onChange={(e) => handlePaymentStatusFilterChange(e)}
              className="filter-select"
            >
              <option value="all">Trạng thái thanh toán: Tất cả</option>
              <option value="noCOD">Không có COD</option>
              <option value="waitingCOD">Chờ nhận COD</option>
              <option value="receivedCOD">Đã nhận COD</option>
            </select>          </div>
        </div>
      </div>
      
      {/* Status tabs */}
      <div className="status-tabs">
        {statusTabs.map(tab => (
          <button 
            key={tab.id}
            className={`status-tab ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="order-actions">
        <button className="print-button" onClick={() => handlePrintOrder()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          In đơn
        </button>
        
        <button className="export-button" onClick={handleExportExcel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          Xuất Excel
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
        {/* Orders table */}
      <div className="orders-table-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Khách hàng</th>
                <th>Người nhận</th>
                <th>Hàng hoá</th>
                <th>Trạng thái</th>
                <th>Nhân viên giao</th>
                <th>Ngày tạo</th>
                <th>Phí giao hàng</th>
                <th>Tiền thu hộ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data-message">
                    {error || 'Không có dữ liệu vận đơn'}
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.MaVanDon || index} className={index % 2 === 0 ? 'row-highlighted' : ''}>
                    <td className="order-code">{order.MaVanDon || 'N/A'}</td>
                    <td>{order.TenKhachHang || 'N/A'}</td>
                    <td>{order.TenNguoiNhan || 'N/A'}</td>
                    <td>{order.TenHH || 'N/A'}</td>
                    <td>{order.TrangThaiDonHang || 'N/A'}</td>
                    <td>{order.TenNhanVien || 'N/A'}</td>
                    <td>{order.NgayTaoDon ? formatDate(order.NgayTaoDon) : 'N/A'}</td>
                    <td>{order.PhiGiaoHang ? formatCurrency(order.PhiGiaoHang) : '0 đ'}</td>
                    <td>{order.TienThuHo ? formatCurrency(order.TienThuHo) : '0 đ'}</td>
                    <td className="action-cell">
                      <button 
                        className="approve-button"
                        onClick={() => handleApprove(order.MaVanDon)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Duyệt</span>
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={() => handleCancel(order.MaVanDon)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span>Huỷ</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan="7">
                  <span>Tổng đơn hàng: {totals.totalOrders}</span>
                </td>
                <td>
                  <span>Tổng thu hộ: {totals.totalCOD}</span>
                </td>
                <td>
                  <span>Tổng cước: {totals.totalShippingFee}</span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan="10">
                  <div className="pagination-controls">
                    <div className="rows-per-page">
                      <span>Bảng ghi mỗi trang:</span>
                      <div className="select-wrapper">
                        <select 
                          value={rowsPerPage} 
                          onChange={handleRowsPerPageChange}
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                    <div className="page-info">
                      {orders.length > 0 
                        ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, orders.length)} of ${orders.length}` 
                        : '0-0 of 0'}
                    </div>
                    <div className="pagination-buttons">
                      <button 
                        className="pagination-button" 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                        </svg>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
