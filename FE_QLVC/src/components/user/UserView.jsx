import React, { useState } from "react";
import { formatCurrency } from "../../utils/formatters";
import "./UserView.css"; 
import qrImg from "../../assets/qr.jpg";

const UserView = ({
    order,
    handleInputChange,
    handleCharacteristicsChange,
    handleProductImageUpload,
    handleRemoveProductImage,
    productImagePreview,
    calculateShippingFee,
    handleOrderSubmit,
    loading,
    showPaymentForm, // Thêm prop này
}) => {
    const [paymentMethod, setPaymentMethod] = useState("cash"); 
    const [waitingAdminConfirm, setWaitingAdminConfirm] = useState(false);
    window.setWaitingAdminConfirm = setWaitingAdminConfirm;
    const [isSubmitting, setIsSubmitting] = useState(false);    // Lắng nghe thay đổi của showPaymentForm để hiển thị modal khi cần
    React.useEffect(() => {
        console.log("Effect triggered - showPaymentForm:", showPaymentForm, "paymentMethod:", paymentMethod);
        
        if (showPaymentForm === true && paymentMethod === "online") {
            console.log("Modal should show - setting waitingAdminConfirm=true");
            // Đảm bảo waitingAdminConfirm được đặt thành true ngay lập tức
            setWaitingAdminConfirm(true);
        }
    }, [showPaymentForm, paymentMethod]);
      // Effect riêng để theo dõi showPaymentForm
    React.useEffect(() => {
        if (showPaymentForm === true) {
            console.log("showPaymentForm changed to true");
            // Nếu showPaymentForm thay đổi thành true và phương thức là online
            // ngay cả khi paymentMethod chưa được cập nhật trong dependency array
            const checkPaymentMethod = localStorage.getItem('selectedPaymentMethod') || paymentMethod;
            console.log("Stored payment method:", checkPaymentMethod);
            
            if (checkPaymentMethod === "online") {
                console.log("Showing modal based on stored payment method");
                setWaitingAdminConfirm(true);
            }
        }
    }, [showPaymentForm, paymentMethod]);const onSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; 
        setIsSubmitting(true);
        try {
            // Lưu lại phương thức thanh toán hiện tại để sử dụng sau khi API hoàn thành
            const currentPaymentMethod = paymentMethod;
            console.log("Current payment method at submission:", currentPaymentMethod);
            
            // Nếu là thanh toán online, đặt waitingAdminConfirm = true trước khi gọi API
            if (currentPaymentMethod === "online") {
                console.log("Setting waitingAdminConfirm=true before API call");
                setWaitingAdminConfirm(true);
            }
            
            // Gọi API tạo đơn hàng
            await handleOrderSubmit(e, { paymentMethod: currentPaymentMethod });
            
            // Hiển thị modal ngay sau khi API hoàn thành, bất kể các trạng thái khác
            if (currentPaymentMethod === "online") {
                console.log("Forcing modal to show after API call");
                setWaitingAdminConfirm(true);
                
                // Dùng force render trick để đảm bảo UI được cập nhật
                setTimeout(() => {
                    // Cập nhật lại một lần nữa sau khi component đã render lại
                    setWaitingAdminConfirm(state => {
                        console.log("Current waitingAdminConfirm:", state);
                        return true;
                    });
                }, 100);
            }
        } catch (error) {
            console.error("Lỗi khi xử lý đơn hàng:", error);
            // Đặt lại waitingAdminConfirm = false nếu có lỗi
            setWaitingAdminConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <h2 className="order-form-title">Tạo đơn hàng vận chuyển</h2>
            <form onSubmit={onSubmit} className="order-form">
                <div className="form-section">
                    <h3 className="form-section-title">Thông tin người nhận</h3>
                    <div className="form-group">
                        <label>Tên người nhận <span className="required">*</span></label>
                        <input
                            type="text"
                            name="receiverName"
                            value={order.receiverName}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập tên người nhận"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ người nhận <span className="required">*</span></label>
                        <input
                            type="text"
                            name="receiverAddress"
                            value={order.receiverAddress}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập đầy đủ địa chỉ người nhận"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Số điện thoại người nhận <span className="required">*</span></label>
                        <input
                            type="tel"
                            name="receiverPhone"
                            value={order.receiverPhone}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập số điện thoại người nhận"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Thông tin hàng hóa</h3>
                    <div className="form-group">
                        <label>Tên hàng hóa <span className="required">*</span></label>
                        <input
                            type="text"
                            name="productName"
                            value={order.productName}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập tên hàng hóa"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Hình ảnh sản phẩm</label>
                        <div className="product-image-upload">
                            <div className="product-image-preview-container">
                                {productImagePreview ? (
                                    <div className="product-image-preview">
                                        <img
                                            src={productImagePreview}
                                            alt="Ảnh xem trước sản phẩm"
                                            className="preview-image"
                                        />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={handleRemoveProductImage}
                                            disabled={loading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <i className="fas fa-camera"></i>
                                        <span>Chưa có ảnh</span>
                                    </div>
                                )}
                            </div>
                            <div className="upload-controls">
                                <label htmlFor="product-image-upload" className="upload-btn">
                                    <i className="fas fa-upload"></i> Tải lên ảnh
                                </label>
                                <input
                                    type="file"
                                    id="product-image-upload"
                                    accept="image/jpeg,image/png,image/jpg"
                                    style={{ display: "none" }}
                                    onChange={handleProductImageUpload}
                                    disabled={loading}
                                />
                                <small className="upload-info">Chấp nhận: JPG, JPEG, PNG. Tối đa 5MB</small>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Trọng lượng (kg) <span className="required">*</span></label>
                        <input
                            type="number"
                            name="weight"
                            value={order.weight}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập trọng lượng hàng hóa"
                            min="0.1"
                            step="0.1"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Số lượng <span className="required">*</span></label>
                        <input
                            type="number"
                            name="quantity"
                            value={order.quantity}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập số lượng sản phẩm"
                            min="1"
                            step="1"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Loại hàng <span className="required">*</span></label>
                        <div className="checkbox-group">
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="food"
                                    name="productType"
                                    value="1"
                                    checked={order.productType === "1"}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                                <label htmlFor="food">Thực phẩm</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="clothing"
                                    name="productType"
                                    value="2"
                                    checked={order.productType === "2"}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                <label htmlFor="clothing">Quần áo</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="electronics"
                                    name="productType"
                                    value="3"
                                    checked={order.productType === "3"}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                <label htmlFor="electronics">Đồ điện tử</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="cosmetics"
                                    name="productType"
                                    value="4"
                                    checked={order.productType === "4"}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                <label htmlFor="cosmetics">Mỹ phẩm</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="other"
                                    name="productType"
                                    value="5"
                                    checked={order.productType === "5"}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                                <label htmlFor="other">Khác</label>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Tính chất hàng hóa <span className="required">*</span></label>
                        <div className="checkbox-group">
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="highValue"
                                    name="productCharacteristics"
                                    value="1" // ID cho Giá trị cao
                                    checked={order.productCharacteristics?.includes("1")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="highValue">Giá trị cao</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="fragile"
                                    name="productCharacteristics"
                                    value="2" // ID cho Dễ vỡ
                                    checked={order.productCharacteristics?.includes("2")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="fragile">Dễ vỡ</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="solid"
                                    name="productCharacteristics"
                                    value="3" // ID cho Nguyên khối
                                    checked={order.productCharacteristics?.includes("3")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="solid">Nguyên khối</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="oversized"
                                    name="productCharacteristics"
                                    value="4" 
                                    checked={order.productCharacteristics?.includes("4")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="oversized">Quá khổ</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="liquid"
                                    name="productCharacteristics"
                                    value="5" 
                                    checked={order.productCharacteristics?.includes("5")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="liquid">Chất lỏng</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id="magnetic"
                                    name="productCharacteristics"
                                    value="6" 
                                    checked={order.productCharacteristics?.includes("6")}
                                    onChange={handleCharacteristicsChange}
                                    disabled={loading}
                                />
                                <label htmlFor="magnetic">Từ tính, Pin</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-section">
                    <h3 className="form-section-title">Thông tin bổ sung</h3>
                    <div className="form-group">
                        <label>Ghi chú (tùy chọn)</label>
                        <textarea
                            name="notes"
                            value={order.notes}
                            onChange={handleInputChange}
                            className="form-textarea"
                            placeholder="Nhập ghi chú cho đơn hàng nếu có"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tiền thu hộ COD (đồng)</label>
                        <input
                            type="number"
                            name="codAmount"
                            value={order.codAmount || 0}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Nhập số tiền thu hộ (nếu có)"
                            min="0"
                            step="1000"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="form-section form-summary">
                    <h3 className="form-section-title">Tóm tắt đơn hàng</h3>
                    <div className="summary-item">
                        <span>Phí vận chuyển:</span>
                        <span className="summary-value">{formatCurrency(calculateShippingFee())}</span>
                    </div>
                    <div className="summary-item">
                        <span>Thu hộ COD:</span>
                        <span className="summary-value">{formatCurrency(order.codAmount || 0)}</span>
                    </div>
                    <div className="summary-item total">
                        <span>Tổng thanh toán:</span>
                        <span className="summary-value">{formatCurrency(calculateShippingFee() + (parseInt(order.codAmount) || 0))}</span>
                    </div>
                </div>
                <div className="form-section">
                    <h3 className="form-section-title">Phương thức thanh toán</h3>
                    <div className="form-group">
                        <div className="checkbox-group">
                            <div className="checkbox-item">                                <input
                                    type="radio"
                                    id="payment-cash"
                                    name="paymentMethod"
                                    value="cash"
                                    checked={paymentMethod === "cash"}
                                    onChange={() => {
                                        setPaymentMethod("cash");
                                        localStorage.setItem('selectedPaymentMethod', 'cash');
                                    }}
                                    disabled={loading}
                                />
                                <label htmlFor="payment-cash">Tiền mặt khi nhận hàng</label>
                            </div>
                            <div className="checkbox-item">
                                <input
                                    type="radio"
                                    id="payment-online"
                                    name="paymentMethod"
                                    value="online"
                                    checked={paymentMethod === "online"}
                                    onChange={() => {
                                        console.log("Switching to online payment");
                                        setPaymentMethod("online");
                                        localStorage.setItem('selectedPaymentMethod', 'online');
                                    }}
                                    disabled={loading}
                                />
                                <label htmlFor="payment-online">Thanh toán online (chuyển khoản)</label>
                            </div>
                        </div>
                    </div>
                </div>                <div className="form-actions">
                    <button type="submit" className="submit-button" disabled={loading || isSubmitting}>
                        {loading || isSubmitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
                    </button>
                </div>            </form>
            
            {/* Thêm console log để debug */}
            {/* {console.log("Current state:", { showPaymentForm, paymentMethod, waitingAdminConfirm })} */}
              {/* THÔNG TIN DEBUG - Xóa trong phiên bản production */}
            {showPaymentForm && (
                <div style={{ padding: '5px', backgroundColor: '#f0f0f0', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px', display: 'none' }}>
                    <div><strong>Debug:</strong> showPaymentForm={showPaymentForm.toString()}, paymentMethod={paymentMethod}, waitingAdminConfirm={waitingAdminConfirm.toString()}</div>
                    <div><strong>Modal hiển thị:</strong> {((waitingAdminConfirm || showPaymentForm) && paymentMethod === "online").toString()}</div>
                </div>
            )}            {/* Modal chờ admin xác nhận với QR code */}
            {/* Chỉ cần xét waitingAdminConfirm để quyết định hiển thị modal - đơn giản hơn */}
            {/* paymentMethod === "online" chỉ là điều kiện phụ không cần thiết lắm vì waitingAdminConfirm
                đã chứa logic của việc có hiển thị hay không */}
            {waitingAdminConfirm && (<div className="payment-modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}>
                    <div className="payment-modal" style={{ 
                        maxWidth: 400, 
                        textAlign: 'center',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div className="payment-modal-header" style={{
                            padding: '15px',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>Chờ admin xác nhận chuyển khoản</h3>
                            <button 
                                className="close-button" 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    console.log("Closing modal...");
                                    setWaitingAdminConfirm(false);
                                    handleOrderSubmit(null, { closeModal: true });
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: 16 }}>
                            <img 
                                src={qrImg}
                                alt="QR MoMo"
                                style={{ width: '100%', maxWidth: 320, borderRadius: 12, marginBottom: 12 }}
                            />
                            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>STK: 9534 4556 876</div>
                            <div>(thongmai)</div>
                            <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
                                Vui lòng chuyển khoản đúng số tiền và ghi rõ nội dung theo hướng dẫn.<br/>
                                Sau khi admin xác nhận đã nhận tiền, đơn hàng của bạn sẽ được tạo.
                            </div>
                        </div>
                        <div style={{ marginTop: 16, color: '#888', fontSize: 13 }}>
                            Đang chờ admin xác nhận chuyển khoản...
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserView;