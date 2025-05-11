import React from 'react';
import './UserNotification.css';

const UserNotification = ({ notifications = [], onClose }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
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
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
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
                                className={`notification-item${noti.DaDoc === 0 ? ' unread' : ''}`}
                            >
                                <div className="notification-message">
                                    {noti.NoiDung && noti.NoiDung.trim() !== ''
                                        ? noti.NoiDung
                                        : 'Thông báo đơn hàng'}
                                </div>
                                <div className="notification-time">
                                    {formatDate(noti.NgayTB)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>    );
};

export default UserNotification;
