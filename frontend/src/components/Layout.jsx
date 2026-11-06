import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../utils/constants";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          OnlineCourse
        </NavLink>
        {user && (
          <nav className="nav">
            <NavLink to="/courses">Khóa học</NavLink>
            {user.role === "instructor" && <NavLink to="/my-courses">Khóa học của tôi</NavLink>}
            <NavLink to="/categories">Danh mục</NavLink>
            <NavLink to="/profile">Tài khoản</NavLink>
          </nav>
        )}
        <div className="topbar-user">
          {user ? (
            <>
              <span>
                {user.fullName} <span className="badge">{ROLE_LABELS[user.role] || user.role}</span>
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Đăng nhập</NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Đăng ký
              </NavLink>
            </>
          )}
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
