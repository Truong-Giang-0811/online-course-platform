import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { ROLE_LABELS } from "../utils/constants";

const menuByRole = {
  admin: [
    { to: "/dashboard", label: "Tổng quan", icon: "▦" },
    { to: "/courses", label: "Quản lý khóa học", icon: "▤" },
    { to: "/categories", label: "Danh mục", icon: "▧" },
    { to: "/tags", label: "Thẻ khóa học", icon: "◇" },
    { to: "/profile", label: "Tài khoản", icon: "◉" },
  ],
  instructor: [
    { to: "/dashboard", label: "Tổng quan", icon: "▦" },
    { to: "/my-courses", label: "Khóa học của tôi", icon: "▤" },
    { to: "/courses/new", label: "Tạo khóa học", icon: "+" },
    { to: "/categories", label: "Danh mục", icon: "▧" },
    { to: "/profile", label: "Tài khoản", icon: "◉" },
  ],
  student: [
    { to: "/dashboard", label: "Tổng quan", icon: "▦" },
    { to: "/courses", label: "Khám phá khóa học", icon: "▤" },
    { to: "/categories", label: "Danh mục", icon: "▧" },
    { to: "/profile", label: "Tài khoản", icon: "◉" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="auth-shell">
        <header className="auth-topbar">
          <NavLink to="/login" className="brand"><span className="brand-mark">O</span> Orbit<span>Learn</span></NavLink>
          <div className="auth-top-actions">
            <NavLink to="/login" className="auth-nav-link">Đăng nhập</NavLink>
            <NavLink to="/register" className="btn btn-primary">Tạo tài khoản</NavLink>
          </div>
        </header>
        <main className="auth-main"><Outlet /></main>
      </div>
    );
  }

  const menu = menuByRole[user.role] || menuByRole.student;
  const pageTitle = menu.find((item) => item.to === location.pathname)?.label ||
    (location.pathname.includes("/edit") ? "Chỉnh sửa khóa học" : "Chi tiết khóa học");

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-scrim" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <NavLink to="/dashboard" className="brand sidebar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">O</span><span>Orbit<span>Learn</span></span>
        </NavLink>
        <div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="sidebar-nav">
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to} end onClick={() => setMenuOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-icon">{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><div className="help-icon">?</div><div><strong>Cần hỗ trợ?</strong><small>Trung tâm trợ giúp</small></div></div>
          <button className="sidebar-logout" onClick={handleLogout}><span>↪</span> Đăng xuất</button>
        </div>
      </aside>

      <div className="main-column">
        <header className="app-topbar">
          <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Mở menu">☰</button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{pageTitle}</strong></div>
          <div className="topbar-profile">
            <div className="topbar-avatar">{(user.fullName || "U").charAt(0).toUpperCase()}</div>
            <div className="topbar-user-info"><strong>{user.fullName}</strong><span>{ROLE_LABELS[user.role] || user.role}</span></div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer">© {new Date().getFullYear()} OrbitLearn · Nền tảng học tập trực tuyến</footer>
      </div>
    </div>
  );
}
