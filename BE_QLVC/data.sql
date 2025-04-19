CREATE DATABASE IF NOT EXISTS QuanLyDonHang;
USE QuanLyDonHang;

-- Table TaiKhoan
CREATE TABLE TaiKhoan (
    ID_TK INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(50) NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    SDT VARCHAR(20) NOT NULL,
    Role VARCHAR(50) NOT NULL
);

-- Table QuanLy
CREATE TABLE QuanLy (
    ID_QL INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_TK INT(11) NOT NULL,
    TenQL VARCHAR(50) NOT NULL,
    DiaChi VARCHAR(255) NOT NULL,
    FOREIGN KEY (ID_TK) REFERENCES TaiKhoan(ID_TK)
);

-- Table KhachHang
CREATE TABLE KhachHang (
    ID_KH INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_TK INT(11) NOT NULL,
    Ten_KH VARCHAR(50) NOT NULL,
    DiaChi VARCHAR(255) NOT NULL,
    FOREIGN KEY (ID_TK) REFERENCES TaiKhoan(ID_TK)
);

-- Table NhanVien
CREATE TABLE NhanVien (
    ID_NV INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_TK INT(11) NOT NULL,
    Ten_NV VARCHAR(50) NOT NULL,
    DiaChi VARCHAR(255) NOT NULL,
    FOREIGN KEY (ID_TK) REFERENCES TaiKhoan(ID_TK)
);

-- Table LoaiHH
CREATE TABLE LoaiHH (
    ID_LHH INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    TenLoaiHH VARCHAR(50) NOT NULL
);

-- Table TinhChatHH
CREATE TABLE TinhChatHH (
    ID_TCHH INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    TenTCHH VARCHAR(50) NOT NULL
);

-- Table HangHoa
CREATE TABLE HangHoa (
    ID_HH INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_LHH INT(11) NOT NULL,
    ID_TCHH INT(11) NOT NULL,
    TenHH VARCHAR(50) NOT NULL,
    SoLuong INT(11) NOT NULL,
    TrongLuong DECIMAL(10,2) NOT NULL,
    image Varchar(255) NOT NULL,
    FOREIGN KEY (ID_LHH) REFERENCES LoaiHH(ID_LHH),
    FOREIGN KEY (ID_TCHH) REFERENCES TinhChatHH(ID_TCHH)
);

-- Table NguoiNhan
CREATE TABLE NguoiNhan (
    ID_NN INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Ten_NN VARCHAR(50) NOT NULL,
    DiaChi VARCHAR(255) NOT NULL,
    SDT VARCHAR(20) NOT NULL
);

-- Table DonHang
CREATE TABLE DonHang (
    ID_DH INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_NV INT(11) NOT NULL,
    ID_KH INT(11) NOT NULL,
    ID_HH INT(11) NOT NULL,
    ID_NN INT(11) NOT NULL,
    MaVanDon VARCHAR(50) NOT NULL,
    NgayTaoDon DATETIME NOT NULL,
    NgayGiaoDuKien DATETIME NULL,
    NgayGiaoThucTe DATETIME NULL,
    TrangThaiDonHang VARCHAR(50) NOT NULL,
    PhiGiaoHang DECIMAL(10,2) NOT NULL,
    GhiChu VARCHAR(255) NULL,
    FOREIGN KEY (ID_NV) REFERENCES NhanVien(ID_NV),
    FOREIGN KEY (ID_KH) REFERENCES KhachHang(ID_KH),
    FOREIGN KEY (ID_HH) REFERENCES HangHoa(ID_HH),
    FOREIGN KEY (ID_NN) REFERENCES NguoiNhan(ID_NN)
);

-- Table ThanhToan
CREATE TABLE ThanhToan (
    ID_TT INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_DH INT(11) NOT NULL,
    TienShip DECIMAL(10,2) NOT NULL,
    TienThuHo DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ID_DH) REFERENCES DonHang(ID_DH)
);

-- Table BaoCao
CREATE TABLE BaoCao (
    ID_BC INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_QL INT(11) NOT NULL,
    Loai_BC VARCHAR(50) NOT NULL,
    FOREIGN KEY (ID_QL) REFERENCES QuanLy(ID_QL)
);

-- Table BaoCaoTaiChinh
CREATE TABLE BaoCaoTaiChinh (
    ID_BCTC INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_BC INT(11) NOT NULL,
    ID_TT INT(11) NOT NULL,
    NgayBatDau DATETIME NOT NULL,
    NgayKetThuc DATETIME NOT NULL,
    TienShip DECIMAL(10,2) NOT NULL,
    TienThuHo DECIMAL(10,2) NOT NULL,
    DoanhThu DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ID_BC) REFERENCES BaoCao(ID_BC),
    FOREIGN KEY (ID_TT) REFERENCES ThanhToan(ID_TT)
);

-- Table BaoCaoNhanVien
CREATE TABLE BaoCaoNhanVien (
    ID_BCNV INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_BC INT(11) NOT NULL,
    ID_NV INT(11) NOT NULL,
    NgayBaoCao DATETIME NOT NULL,
    SoDonGiao INT(11) NOT NULL,
    SoDonTre INT(11) NOT NULL,
    DanhGiaHieuSuat VARCHAR(50) NOT NULL,
    FOREIGN KEY (ID_BC) REFERENCES BaoCao(ID_BC),
    FOREIGN KEY (ID_NV) REFERENCES NhanVien(ID_NV)
);

-- Table ThongBao
CREATE TABLE ThongBao (
    ID_TB INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ID_DH INT(11) NOT NULL,
    NoiDung VARCHAR(255) NOT NULL,
    NgayTB DATETIME NOT NULL,
    FOREIGN KEY (ID_DH) REFERENCES DonHang(ID_DH)
);