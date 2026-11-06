import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";

// roles: danh sách vai trò được phép; bỏ trống nghĩa là chỉ cần đăng nhập.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted center">Đang tải phiên đăng nhập...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h2>Không có quyền truy cập</h2>
        <p className="muted">Trang này không dành cho vai trò "{user.role}".</p>
      </div>
    );
  }
  return <Outlet />;
}
