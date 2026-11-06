import { Link } from 'react-router-dom';
import './Footer.css';
export default function Footer(){return <footer className="ph-footer" id="footer"><div className="ph-footer-grid">
  <div><Link to="/" className="ph-footer-logo">PHONE<span>HUB</span></Link><p>Khám phá công nghệ phù hợp với bạn. PhoneHub đồng hành cùng trải nghiệm mua sắm thiết bị thông minh.</p></div>
  <div><strong>Về PhoneHub</strong><a href="#footer">Giới thiệu</a><a href="#footer">Hệ thống cửa hàng</a><a href="#footer">Liên hệ</a></div>
  <div><strong>Hỗ trợ khách hàng</strong><a href="#footer">Chính sách bảo hành</a><a href="#footer">Chính sách đổi trả</a><a href="#footer">Câu hỏi thường gặp</a></div>
  <div><strong>Kết nối với chúng tôi</strong><span>Hotline: 1900 0000</span><span>Email: support@phonehub.example</span></div>
</div><div className="ph-footer-bottom">© {new Date().getFullYear()} PhoneHub. Giao diện mẫu phục vụ phát triển dự án.</div></footer>}
