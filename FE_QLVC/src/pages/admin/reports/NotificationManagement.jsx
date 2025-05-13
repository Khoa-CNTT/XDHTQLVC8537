import React, { useState, useEffect } from 'react';
import './NotificationManagement.css';
import { notificationService } from '../../../services/notificationService';
import { toast } from 'react-toastify';

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'
    
    useEffect(() => {
        fetchNotifications();
    }, []);
    
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications();
            setNotifications(response || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Không thể tải thông báo. Vui lòng thử lại sau.');
            toast.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    };
    
    const handleRefresh = () => {
        fetchNotifications();
        toast.info('Đã làm mới danh sách thông báo');
    };
    
    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prevNotifications => 
                prevNotifications.map(noti => 
                    noti.ID_TB === notificationId ? { ...noti, DaDoc: 1 } : noti
                )
            );
            toast.success('Đã đánh dấu đã đọc');
        } catch (err) {
            console.error('Error marking notification as read:', err);
            toast.error('Không thể đánh dấu thông báo');
        }
    };
    
    const handleDeleteNotification = async (notificationId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            try {
                await notificationService.deleteNotification(notificationId);
                setNotifications(prevNotifications => 
                    prevNotifications.filter(noti => noti.ID_TB !== notificationId)
                );
                toast.success('Đã xóa thông báo');
            } catch (err) {
                console.error('Error deleting notification:', err);
                toast.error('Không thể xóa thông báo');
            }
        }
    };
    
    const filteredNotifications = notifications.filter(noti => {
        if (filter === 'all') return true;
        if (filter === 'read') return noti.DaDoc === 1;
        if (filter === 'unread') return noti.DaDoc === 0;
        return true;
    });
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
    };    return (
        <div className="notification-management-container">
            <div className="notification-management-header">
                <h1 className="notification-management-title">Quản lý thông báo</h1>
                <p className="notification-management-subtitle">Xem và quản lý tất cả thông báo trong hệ thống</p>
            </div>
            
            <div className="notification-actions">
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tất cả
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Chưa đọc
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
                        onClick={() => setFilter('read')}
                    >
                        Đã đọc
                    </button>
                </div>
                <button className="refresh-button" onClick={handleRefresh}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Làm mới
                </button>
            </div>
            
            {loading ? (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : error ? (
                <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                </div>
            ) : (
                <div className="notification-management-content">
                    <div className="notification-list">
                        {(!filteredNotifications || filteredNotifications.length === 0) ? (
                            <div className="no-notification">Không có thông báo nào trong hệ thống.</div>
                        ) : (
                            filteredNotifications.map((noti, idx) => (
                            <div
                                key={noti.ID_TB || idx}
                                className={`notification-item${noti.DaDoc === 0 ? ' unread' : ''}`}
                            >
                                <div className="notification-message">
                                    {noti.NoiDung && noti.NoiDung.trim() !== ''
                                        ? noti.NoiDung
                                        : 'Thông báo đơn hàng'}
                                </div>                                <div className="notification-time">
                                    {formatDate(noti.NgayTB)}
                                </div>
                                <div className="notification-actions">
                                    {noti.DaDoc === 0 && (
                                        <button 
                                            className="notification-action-btn mark-read-btn"
                                            onClick={() => handleMarkAsRead(noti.ID_TB)}
                                            title="Đánh dấu đã đọc"
                                        >
                                            <i className="fas fa-check"></i>
                                        </button>
                                    )}
                                    <button 
                                        className="notification-action-btn delete-btn"
                                        onClick={() => handleDeleteNotification(noti.ID_TB)}
                                        title="Xóa thông báo"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManagement;
