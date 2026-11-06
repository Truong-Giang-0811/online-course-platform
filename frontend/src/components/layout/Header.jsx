import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Header.css';

export default function Header({ searchTerm, onSearchChange, cartCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleAccount = () => { if (user) logout(); navigate('/login'); };
  return <header className="ph-header">
    <div className="ph-header-main">
      <Link to="/" className="ph-logo"><i>P</i><span>PHONE<b>HUB</b></span></Link>
      <label className="ph-search"><span>⌕</span><input type="search" value={searchTerm} onChange={e => onSearchChange(e.target.value)} placeholder="Tìm điện thoại, thương hiệu..." /></label>
      <div className="ph-actions">
        <button onClick={handleAccount} className="ph-account"><span>♙</span><small>{user?.fullName || user?.name || 'Đăng nhập'}</small></button>
        <button onClick={() => window.alert(`Bạn đang có ${cartCount} sản phẩm trong giỏ hàng.`)} className="ph-cart"><span>♧</span><small>Giỏ hàng</small><b>{cartCount}</b></button>
      </div>
    </div>
    <nav className="ph-nav"><Link to="/">Trang chủ</Link><a href="#categories">Danh mục sản phẩm</a><a href="#products">Điện thoại</a><a href="#footer">Hỗ trợ khách hàng</a><span>Ưu đãi công nghệ mỗi ngày</span></nav>
  </header>;
}
