-- Tạo bảng DonHangTam để lưu đơn hàng trước khi nhân viên nhận
-- Cấu trúc tương tự bảng DonHang nhưng ID_NV có thể NULL
CREATE TABLE IF NOT EXISTS DonHangTam (
    ID_DHT INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_KH INT(11) NOT NULL,
    ID_HH INT(11) NOT NULL,
    ID_NN INT(11) NOT NULL,
    MaVanDon VARCHAR(50) NOT NULL,
    NgayTaoDon DATETIME NOT NULL,
    NgayGiaoDuKien DATETIME NULL,
    TrangThaiDonHang VARCHAR(50) NOT NULL DEFAULT 'Đang chờ xử lý',
    PhiGiaoHang DECIMAL(10,2) NOT NULL,
    GhiChu VARCHAR(255) NULL,
    FOREIGN KEY (ID_KH) REFERENCES KhachHang(ID_KH),
    FOREIGN KEY (ID_HH) REFERENCES HangHoa(ID_HH),
    FOREIGN KEY (ID_NN) REFERENCES NguoiNhan(ID_NN)
);

-- Tạo bảng ThanhToanTam để lưu thông tin thanh toán của đơn hàng tạm
CREATE TABLE IF NOT EXISTS ThanhToanTam (
    ID_TTT INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_DHT INT(11) NOT NULL,
    Tienship DECIMAL(10,2) NOT NULL,
    TienThuHo DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ID_DHT) REFERENCES DonHangTam(ID_DHT)
);


-- Bảng để lưu thông báo liên quan đến đơn hàng tạm
CREATE TABLE IF NOT EXISTS ThongBaoTam (
    ID_TBT INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_DHT INT(11) NOT NULL,
    NoiDung VARCHAR(255) NOT NULL,
    NgayTB DATETIME NOT NULL,
    FOREIGN KEY (ID_DHT) REFERENCES DonHangTam(ID_DHT)
);
