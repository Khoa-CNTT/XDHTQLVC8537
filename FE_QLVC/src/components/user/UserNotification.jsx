import React from 'react';
import './UserNotification.css';

const UserNotification = ({ notifications = [], onClose }) => {    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        // Check if we already have a formatted date from the server
        if (typeof dateString === 'string' && dateString.includes('/')) {
            return dateString;
        }
        
        try {
            // Ensure we handle the date with proper timezone awareness
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Ngày không hợp lệ';
            }
            
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMinutes < 60) {
                return `${diffMinutes} phút trước`;
            } else if (diffHours < 24) {
                return `${diffHours} giờ trước`;
            } else if (diffDays < 7) {
                return `${diffDays} ngày trước`;
            } else {
                // Use explicit timezone for Vietnam
                return date.toLocaleString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Asia/Ho_Chi_Minh' // Explicitly use Vietnam timezone
                });
            }
        } catch (err) {
            console.error('Error formatting date:', err);
            return String(dateString);
        }
    };

    // Function to determine notification icon based on type
    const getNotificationIcon = (notification) => {
        // Check for payment confirmed notifications
        if (notification.NoiDung && notification.NoiDung.includes('thanh toán')) {
            return '💰';
        } else if (notification.NoiDung && notification.NoiDung.includes('xác nhận')) {
            return '✅';
        } else if (notification.NoiDung && notification.NoiDung.includes('giao hàng')) {
            return '🚚';
        } else if (notification.NoiDung && notification.NoiDung.includes('đã nhận')) {
            return '📦';
        } else {
            return '🔔';
        }
    };

    // Function to determine CSS class based on notification content
    const getNotificationClass = (notification) => {
        let classes = notification.DaDoc === 0 ? 'notification-item unread' : 'notification-item';
        
        // Add special classes for payment confirmations
        if (notification.NoiDung && notification.NoiDung.includes('thanh toán')) {
            classes += ' payment-notification';
        } else if (notification.NoiDung && notification.NoiDung.includes('xác nhận')) {
            classes += ' confirmation-notification';
        }
        
        return classes;
    };
    
    return (
        <div className="user-notification-popup" onClick={onClose}>
            <div className="user-notification-content" onClick={e => e.stopPropagation()}>
                <div className="user-notification-header">
                    <span>Thông báo của bạn</span>
                    <div style={{ flex: 1 }} />
                    <button className="close-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="user-notification-list">
                    {(!notifications || notifications.length === 0) ? (
                        <div className="no-notification">Không có thông báo nào.</div>
                    ) : (
                        notifications.map((noti, idx) => (
                            <div
                                key={noti.ID_TB || idx}
                                className={getNotificationClass(noti)}
                            >
                                <div className="notification-icon">
                                    {getNotificationIcon(noti)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-message">
                                        {noti.NoiDung && noti.NoiDung.trim() !== ''
                                            ? noti.NoiDung
                                            : 'Thông báo đơn hàng'}
                                    </div>                                    <div className="notification-time">
                                        {formatDate(noti.NgayTB_Formatted || noti.NgayTB)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>    );
};

export default UserNotification;
