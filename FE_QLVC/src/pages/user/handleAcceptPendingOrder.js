// Função para um funcionário aceitar um pedido pendente
const handleAcceptPendingOrder = async (pendingOrderId, staffId, orderService, setLoading, setError, setPendingOrders, setOrders) => {
  if (!staffId) {
    setError('Bạn cần đăng nhập với vai trò nhân viên để có thể nhận đơn hàng.');
    return;
  }
  
  if (!window.confirm('Bạn có muốn nhận đơn hàng này không?')) {
    return;
  }
  
  try {
    setLoading(true);
    
    // Gọi API để nhận đơn hàng
    await orderService.acceptPendingOrder(pendingOrderId, staffId);
    
    // Lấy lại danh sách đơn hàng đang chờ xác nhận
    const updatedPendingOrders = await orderService.getPendingOrders();
    setPendingOrders(updatedPendingOrders || []);
    
    // Lấy lại danh sách đơn hàng đã nhận
    const updatedOrders = await orderService.getOrdersByStaff(staffId);
    setOrders(updatedOrders || []);
    
    alert('Đã nhận đơn hàng thành công!');
  } catch (err) {
    setError(err.message || 'Lỗi khi nhận đơn hàng');
    console.error('Error accepting pending order:', err);
  } finally {
    setLoading(false);
  }
};

export default handleAcceptPendingOrder;
