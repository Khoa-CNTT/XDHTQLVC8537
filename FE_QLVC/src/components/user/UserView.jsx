import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import './UserView.css'; // Import the new CSS file

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
    error,
    showPaymentForm,
    createdOrder,
    handleClosePaymentForm,
    handlePayment,
    
}) => {
    return (
        <>
            <h2 className="order-form-title">Tạo đơn hàng vận chuyển</h2>
            <form onSubmit={handleOrderSubmit} className="order-form">
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
                                    style={{ display: 'none' }}
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
                                    checked={order.productCharacteristics?.includes('1')}
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
                                    checked={order.productCharacteristics?.includes('2')}
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
                                    checked={order.productCharacteristics?.includes('3')}
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
                                    value="4" // ID cho Quá khổ
                                    checked={order.productCharacteristics?.includes('4')}
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
                                    value="5" // ID cho Chất lỏng
                                    checked={order.productCharacteristics?.includes('5')}
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
                                    value="6" // ID cho Từ tính, Pin
                                    checked={order.productCharacteristics?.includes('6')}
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

                <div className="form-actions">
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Đang tạo...' : 'Tạo đơn hàng'}
                    </button>
                </div>
            </form>
            
            {/* Form thanh toán sau khi đơn hàng được tạo */}
            {showPaymentForm && createdOrder && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <div className="payment-modal-header">
                            <h3>Thanh toán đơn hàng</h3>
                            <button 
                                className="close-button" 
                                onClick={handleClosePaymentForm}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="payment-modal-body">
                            <div className="order-summary">
                                <h4>Thông tin đơn hàng</h4>
                                <div className="summary-row">
                                    <span className="label">Mã vận đơn:</span>
                                    <span className="value">{createdOrder.maVanDon}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">Phí vận chuyển:</span>
                                    <span className="value">{formatCurrency(calculateShippingFee())}</span>
                                </div>
                                {parseInt(order.codAmount) > 0 && (
                                    <div className="summary-row">
                                        <span className="label">Thu hộ (COD):</span>
                                        <span className="value">{formatCurrency(parseInt(order.codAmount))}</span>
                                    </div>
                                )}
                                <div className="summary-row total">
                                    <span className="label">Tổng thanh toán:</span>
                                    <span className="value">{formatCurrency(calculateShippingFee())}</span>
                                </div>
                            </div>
                            
                            <div className="payment-methods">
                                <h4>Chọn phương thức thanh toán</h4>
                                <div className="payment-options">
                                    <button 
                                        className="payment-option-btn" 
                                        onClick={() => handlePayment('Chuyển khoản ngân hàng')}
                                        disabled={loading}
                                    >
                                        <span className="payment-icon">🏦</span>
                                        Chuyển khoản ngân hàng
                                    </button>
                                    
                                    <button 
                                        className="payment-option-btn" 
                                        onClick={() => handlePayment('Ví điện tử MoMo')}
                                        disabled={loading}
                                    >
                                        <span className="payment-icon">📱</span>
                                        Ví điện tử MoMo
                                    </button>
                                    
                                    <button 
                                        className="payment-option-btn" 
                                        onClick={() => handlePayment('VNPay QR')}
                                        disabled={loading}
                                    >
                                        <span className="payment-icon">🔄</span>
                                        VNPay QR
                                    </button>
                                    
                                    <button 
                                        className="payment-option-btn" 
                                        onClick={() => handlePayment('Tiền mặt khi nhận hàng')}
                                        disabled={loading}
                                    >
                                        <span className="payment-icon">💵</span>
                                        Tiền mặt khi nhận hàng
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {loading && (
                            <div className="payment-loading">
                                <span className="loading-spinner"></span>
                                <p>Đang xử lý thanh toán...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="payment-error">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default UserView;