import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import thongImg from "../../assets/thong.jpg";

const ForgotpasswordPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        "http://localhost:8080/api/forgotpassword",
        {
          Email: email,
          MatKhau: password,
          XacNhanMK: confirmPassword,
        }
      );
      if (response.data.success) {
        setMessage("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
        setError("");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.data.error || "Lỗi không xác định");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.response?.data?.error || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgotpassword-container">
      <div className="forgotpassword-content">
        <div
          className="forgotpassword-left"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(30, 64, 175, 0.8)), url(${thongImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="forgotpassword-logo">
            <h2 className="text-white text-4xl font-bold mb-4">QLVC</h2>
            <h2 className="text-white text-2xl">
              Hệ thống quản lý vận chuyển giúp bạn theo dõi và quản lý hàng hóa
              một cách hiệu quả
            </h2>
          </div>
        </div>

        <div className="forgotpassword-form-container">
          <div className="forgotpassword-box">
            {error && <div className="message error-message">{error}</div>}
            {message && (
              <div className="message success-message">{message}</div>
            )}

            <form onSubmit={handleSubmit} className="forgotpassword-form">
              <input
                type="email"
                className="forgotpassword-input"
                placeholder="Nhập Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                type="password"
                className="forgotpassword-input"
                placeholder="Mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                type="password"
                className="forgotpassword-input"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                className="forgotpassword-button"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>

            <div className="forgotpassword-divider"></div>
            <div className="text-center">
              <a href="/login" className="login-link">
                Quay lại trang đăng nhập
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotpasswordPage;
