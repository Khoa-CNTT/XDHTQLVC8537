import React from 'react';
import './StaffNotification.css';

const StaffNotification = ({ notifications = [], onClose }) => {
    // Debug log để kiểm tra dữ liệu nhận được
    return (
        <div className="staff-notification-popup" onClick={onClose}>
            <div className="staff-notification-content" onClick={e => e.stopPropagation()}>
                <div className="staff-notification-header">
                    <span>Thông báo</span>
                    <div style={{ flex: 1 }} />
                    <button className="close-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="staff-notification-list">
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
                                        : 'Thông báo'}
                                </div>
                                <div className="notification-time">
                                    {noti.NgayTB ? new Date(noti.NgayTB).toLocaleString('vi-VN') : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffNotification;
