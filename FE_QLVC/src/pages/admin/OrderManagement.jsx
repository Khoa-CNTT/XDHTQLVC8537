import React, { useState, useEffect, useRef, useCallback } from 'react';
import './OrderManagement.css';
import { orderService } from '../../services/orderService';
import socketService from '../../services/socketService'; // Đảm bảo đã có service này
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import OrderDetailModal from '../../components/modals/OrderDetailModal';

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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const orderTableRef = useRef(null);
  
  // Enhanced fetch orders function with pending orders handling
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Use the getOrders method from orderService      
      const orderData = await orderService.getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payer: payerFilter !== 'all' ? payerFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined
      });
      
      // Store all orders for export functionality
      setAllOrdersData(orderData);
      
      // Identify pending orders (awaiting admin approval)
      const pending = orderData.filter(order => order.TrangThaiDonHang === 'Chờ duyệt');
      setPendingOrders(pending);
      
      // Filter orders based on code/name if orderFilter is provided
      const filteredData = orderFilter 
        ? orderData.filter(order => 
            (order.MaVanDon || '').toLowerCase().includes(orderFilter.toLowerCase()) ||
            (order.TenKhachHang || '').toLowerCase().includes(orderFilter.toLowerCase()) ||
            (order.TenNguoiNhan || '').toLowerCase().includes(orderFilter.toLowerCase())
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
      
      // Adjust current page if needed
      if (currentPage > total) {
        setCurrentPage(1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Không thể tải dữ liệu vận đơn. Vui lòng thử lại sau.');
      setOrders([]);
      setPendingOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, rowsPerPage, orderFilter, statusFilter, payerFilter, paymentStatusFilter]);

  // Handle refresh button
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Call fetchOrders when component mounts or dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket listeners for real-time updates
  useEffect(() => {
    // Lắng nghe khi có đơn hàng mới
    const unsubNewOrder = socketService.onNewOrder((data) => {
      console.log('Admin nhận được sự kiện đơn hàng mới:', data);
      toast.info(`Đơn hàng mới ${data.MaVanDon} vừa được tạo!`);
      fetchOrders();
    });
    
    // Lắng nghe khi có đơn hàng được tiếp nhận
    const unsubOrderAccepted = socketService.onOrderAccepted((data) => {
      console.log('Admin nhận được sự kiện đơn hàng được tiếp nhận:', data);
      toast.info(`Đơn hàng ${data.MaVanDon} đã được nhân viên tiếp nhận!`);
      fetchOrders();
    });
    
    // Lắng nghe khi trạng thái đơn hàng thay đổi
    const unsubOrderStatusChanged = socketService.onOrderStatusChanged((data) => {
      console.log('Admin nhận được sự kiện trạng thái đơn hàng thay đổi:', data);
      toast.info(`Đơn hàng ${data.MaVanDon} đã được cập nhật: ${data.newStatus}`);
      fetchOrders();
    });

    // Lắng nghe khi đơn hàng bị hủy
    const unsubOrderCanceled = socketService.onOrderCanceled((data) => {
      console.log('Admin nhận được sự kiện đơn hàng bị hủy:', data);
      toast.warning(`Đơn hàng ${data.MaVanDon} đã bị hủy. Lý do: ${data.reason || 'Không có lý do'}`);
      fetchOrders();
    });
    
    // Hủy đăng ký lắng nghe khi component unmount
    return () => {
      unsubNewOrder();
      unsubOrderAccepted();
      unsubOrderStatusChanged();
      unsubOrderCanceled();
    };
  }, [fetchOrders]);

  // Add notification display for pending orders on initial load
  useEffect(() => {
    if (pendingOrders.length > 0 && !loading) {
      toast.info(`Có ${pendingOrders.length} đơn hàng đang chờ duyệt`, {
        autoClose: 5000,
        position: toast.POSITION.TOP_RIGHT
      });
    }
  }, [pendingOrders.length, loading]);

  // Handle approve action with improved error handling and feedback
  const handleApprove = async (orderId) => {
    try {
      toast.info("Đang xử lý duyệt đơn hàng...", { autoClose: 2000 });
      await orderService.approveOrder(orderId);
      toast.success(`Đơn hàng ${orderId} đã được duyệt thành công!`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to approve order:', err);
      toast.error(`Không thể duyệt đơn hàng: ${err.message || "Lỗi không xác định"}`);
    }
  };
  
  // Handle approve all pending orders
  const handleApproveAll = async () => {
    if (pendingOrders.length === 0) {
      toast.info("Không có đơn hàng nào chờ duyệt");
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn duyệt tất cả ${pendingOrders.length} đơn hàng đang chờ?`)) {
      try {
        toast.info("Đang xử lý duyệt đơn hàng...", { autoClose: 2000 });
        const promises = pendingOrders.map(order => orderService.approveOrder(order.MaVanDon));
        await Promise.all(promises);
        toast.success(`Đã duyệt thành công ${pendingOrders.length} đơn hàng!`);
        fetchOrders();
      } catch (err) {
        console.error('Failed to approve orders:', err);
        toast.error(`Có lỗi xảy ra khi duyệt đơn hàng: ${err.message || "Lỗi không xác định"}`);
      }
    }
  };
  
  // Handle cancel action with improved error handling and feedback
  const handleCancel = async (orderId) => {
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (reason === null) return; // User clicked Cancel
    
    if (reason.trim() === '') {
      toast.warning('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    
    try {
      toast.info("Đang xử lý hủy đơn hàng...", { autoClose: 2000 });
      await orderService.cancelOrder(orderId, reason);
      toast.success(`Đơn hàng ${orderId} đã được hủy!`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast.error(`Không thể hủy đơn hàng: ${err.message || "Lỗi không xác định"}`);
    }
  };
  
  // Handle print order - now using react-to-print
  const handlePrintOrder = useReactToPrint({
    content: () => orderTableRef.current,
    documentTitle: `Danh sách vận đơn - ${new Date().toLocaleDateString('vi-VN')}`,
    onBeforeGetContent: () => {
      toast.info('Đang chuẩn bị in...', { autoClose: 1000 });
      return new Promise(resolve => {
        resolve();
      });
    },
    onAfterPrint: () => toast.success('Đã gửi lệnh in thành công!'),
    onPrintError: () => toast.error('Có lỗi xảy ra khi in!')
  });
  
  // Handle export to Excel - implemented
  const handleExportExcel = () => {
    try {
      toast.info("Đang xuất dữ liệu...", { autoClose: 2000 });
      
      // Format data for export
      const exportData = allOrdersData.map(order => ({
        'Mã vận đơn': order.MaVanDon || '',
        'Khách hàng': order.TenKhachHang || '',
        'Người nhận': order.TenNguoiNhan || '',
        'Hàng hoá': order.TenHH || '',
        'Trạng thái': order.TrangThaiDonHang || '',
        'Nhân viên giao': order.TenNhanVien || '',
        'Ngày tạo': order.NgayTaoDon ? new Date(order.NgayTaoDon).toLocaleString('vi-VN') : '',
        'Phí giao hàng': order.PhiGiaoHang || 0,
        'Tiền thu hộ': order.TienThuHo || 0
      }));
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vận Đơn");
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Use FileSaver dynamically imported
      import('file-saver').then(module => {
        const { saveAs } = module;
        saveAs(data, `Danh_sach_van_don_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '_')}.xlsx`);
        toast.success("Xuất Excel thành công!");
      }).catch(err => {
        console.error("Lỗi khi tải module file-saver:", err);
        toast.error("Có lỗi xảy ra khi xuất Excel. Không thể tải module file-saver!");
      });
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      toast.error("Có lỗi xảy ra khi xuất Excel!");
    }
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
  
  // View order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
      return '0 đ';
    }
    return new Intl.NumberFormat('vi-VN', { 
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' đ';
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalOrders = orders.length;
    let totalCOD = orders.reduce((sum, order) => sum + (Number(order.TienThuHo) || 0), 0);
    let totalShippingFee = orders.reduce((sum, order) => sum + (Number(order.PhiGiaoHang) || 0), 0);
    
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
    { id: 'Chờ duyệt', label: 'Chờ duyệt' },
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
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Chờ duyệt': return 'status-badge-pending';
      case 'Đã tiếp nhận': return 'status-badge-received';
      case 'Đang lấy': return 'status-badge-picking';
      case 'Đã lấy': return 'status-badge-picked';
      case 'Lấy thất bại': return 'status-badge-failed';
      case 'Đang vận chuyển': return 'status-badge-transit';
      case 'Đang giao': return 'status-badge-delivering';
      case 'Đã giao': return 'status-badge-delivered';
      case 'Giao thất bại': return 'status-badge-failed';
      case 'Quá hạn giao': return 'status-badge-overdue';
      case 'Huỷ giao': return 'status-badge-cancelled';
      case 'Đã Hoàn': return 'status-badge-returned';
      default: return 'status-badge-default';
    }
  };

  return (
    <div className="order-management-container">
      {/* Pending orders notification */}
      {pendingOrders.length > 0 && (
        <div className="pending-orders-alert">
          <div className="pending-orders-header">
            <div className="pending-orders-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h3>Có {pendingOrders.length} đơn hàng chờ duyệt</h3>
            <button className="confirm-pending-btn" onClick={handleApproveAll}>Duyệt tất cả</button>
          </div>
          
          <div className="pending-orders-list">
            {pendingOrders.slice(0, 3).map((order) => (
              <div key={order.MaVanDon} className="pending-order-item">
                <span>Mã vận đơn: <b>{order.MaVanDon}</b> | Khách hàng: <b>{order.TenKhachHang}</b></span>
                <button className="confirm-pending-btn" onClick={() => handleApprove(order.MaVanDon)}>
                  Duyệt
                </button>
              </div>
            ))}
            {pendingOrders.length > 3 && (
              <div className="more-pending">
                và {pendingOrders.length - 3} đơn hàng khác...
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="order-management-header">
        <h1 className="order-management-title">Quản lý vận đơn</h1>
        
        <div className="order-header-actions">
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <svg className={refreshing ? "spinning" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </div>
      </div>
      
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
              placeholder="Tìm theo mã vận đơn, khách hàng, người nhận..."
              className="search-input"
              value={orderFilter}
              onChange={handleSearchChange}
            />
            {orderFilter && (
              <button 
                className="clear-search" 
                onClick={() => setOrderFilter('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
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
            </select>
          </div>
        </div>
      </div>
      
      {/* Status tabs */}
      <div className="status-tabs-container">
        <div className="status-tabs">
          {statusTabs.map((tab) => (
            <button 
              key={tab.id}
              className={`status-tab ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange(tab.id)}
            >
              {tab.label}
              {tab.id === 'Chờ duyệt' && pendingOrders.length > 0 && 
                <span className="status-counter">{pendingOrders.length}</span>
              }
            </button>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="order-actions">
        <button className="action-button print-button" onClick={handlePrintOrder}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          In danh sách đơn
        </button>
        
        <button className="action-button export-button" onClick={handleExportExcel}>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      
      {/* Orders table */}
      <div className="orders-table-container" ref={orderTableRef}>
        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
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
                  <tr key={order.MaVanDon || index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="order-code">
                      <span className="order-code-text">{order.MaVanDon || 'N/A'}</span>
                    </td>
                    <td>{order.TenKhachHang || 'N/A'}</td>
                    <td>{order.TenNguoiNhan || 'N/A'}</td>
                    <td>{order.TenHH || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(order.TrangThaiDonHang)}`}>
                        {order.TrangThaiDonHang || 'N/A'}
                      </span>
                    </td>
                    <td>{order.TenNhanVien || 'N/A'}</td>
                    <td>{order.NgayTaoDon ? formatDate(order.NgayTaoDon) : 'N/A'}</td>
                    <td>{order.PhiGiaoHang ? formatCurrency(order.PhiGiaoHang) : '0 đ'}</td>
                    <td>{order.TienThuHo ? formatCurrency(order.TienThuHo) : '0 đ'}</td>
                    <td className="action-cell">
                      <button 
                        className="table-action-button view-button"
                        onClick={() => handleViewOrderDetails(order)}
                        title="Xem chi tiết"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      
                      {order.TrangThaiDonHang === 'Chờ duyệt' && (
                        <button 
                          className="table-action-button approve-button"
                          onClick={() => handleApprove(order.MaVanDon)}
                          title="Duyệt đơn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </button>
                      )}
                      
                      {['Chờ duyệt', 'Đã tiếp nhận'].includes(order.TrangThaiDonHang) && (
                        <button 
                          className="table-action-button cancel-button"
                          onClick={() => handleCancel(order.MaVanDon)}
                          title="Hủy đơn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan="7">
                  <span>Tổng đơn hàng: <strong>{totals.totalOrders}</strong></span>
                </td>
                <td>
                  <span>Tổng phí giao: <strong>{totals.totalShippingFee}</strong></span>
                </td>
                <td>
                  <span>Tổng thu hộ: <strong>{totals.totalCOD}</strong></span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan="10">
                  <div className="pagination-controls">
                    <div className="rows-per-page">
                      <span>Hiển thị:</span>
                      <div className="select-wrapper">
                        <select 
                          value={rowsPerPage} 
                          onChange={handleRowsPerPageChange}
                          className="rows-select"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                    <div className="page-info">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <div className="pagination-buttons">
                      <button 
                        className="pagination-button" 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        title="Trang trước"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                        </svg>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        title="Trang tiếp"
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
      
      {/* Order detail modal */}
      {showOrderDetail && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderDetail(false)}
          onApprove={handleApprove}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default OrderManagement;
