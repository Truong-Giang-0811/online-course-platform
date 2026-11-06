import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { authApi } from "../api/services";
import Alert from "../components/Alert";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../utils/constants";

export default function ProfilePage() {
  const { logoutAll } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi
      .me()
      .then((res) => setProfile(res.data.user))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleLogoutAll = async () => {
    if (!window.confirm("Đăng xuất khỏi tất cả thiết bị?")) return;
    await logoutAll();
    navigate("/login");
  };

  return (
    <div className="card">
      <h1>Tài khoản của tôi</h1>
      <Alert>{error}</Alert>
      {profile && (
        <dl className="details">
          <dt>Họ tên</dt>
          <dd>{profile.fullName}</dd>
          <dt>Email</dt>
          <dd>{profile.email}</dd>
          <dt>Vai trò</dt>
          <dd>{ROLE_LABELS[profile.role] || profile.role}</dd>
          <dt>Trạng thái</dt>
          <dd>{profile.status}</dd>
          <dt>Ngày tạo</dt>
          <dd>{new Date(profile.createdAt).toLocaleString("vi-VN")}</dd>
        </dl>
      )}
      <button className="btn btn-danger" onClick={handleLogoutAll}>
        Đăng xuất khỏi tất cả phiên
      </button>
    </div>
  );
}
