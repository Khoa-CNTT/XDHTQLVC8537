import React from 'react';
import './StaffView.css';
import logo from '../../assets/thong.jpg';

const StaffView = () => {
    return (
        <div className="intro-container">
            <header className="intro-header">
                <img src={logo} alt="Quản Lý Vận Chuyển" className="intro-logo" />
                <h1>Hệ Thống Quản Lý Vận Chuyển</h1>
            </header>
            <section className="intro-content">
                <h2>Giới Thiệu</h2>
                <p>
                    Hệ thống Quản Lý Vận Chuyển giúp doanh nghiệp tối ưu hóa quy trình giao nhận hàng hóa, theo dõi trạng thái đơn hàng, quản lý nhân viên và nâng cao trải nghiệm khách hàng.
                </p>
                <ul className="intro-benefits">
                    <li><i className="fas fa-truck"></i> Theo dõi trạng thái vận chuyển theo thời gian thực</li>
                    <li><i className="fas fa-users"></i> Quản lý nhân viên giao nhận hiệu quả</li>
                    <li><i className="fas fa-chart-line"></i> Báo cáo, thống kê minh bạch</li>
                    <li><i className="fas fa-mobile-alt"></i> Giao diện thân thiện, dễ sử dụng trên mọi thiết bị</li>
                </ul>
                <div className="intro-image-box">
                    <img src={logo} alt="Vận chuyển" className="intro-image" />
                </div>
            </section>
            <footer className="intro-footer">
                <p>Liên hệ: <a href="mailto:support@qlvc.vn">support@qlvc.vn</a> | Hotline: 0123 456 789</p>
                <p>&copy; {new Date().getFullYear()} Quản Lý Vận Chuyển</p>
            </footer>
        </div>
    );
};

export default StaffView;