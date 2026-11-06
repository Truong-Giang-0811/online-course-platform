import { Link } from 'react-router-dom';
import './HeroBanner.css';
export default function HeroBanner(){return <section className="ph-hero"><div className="ph-hero-copy">
  <span className="ph-eyebrow"><i/> PHONEHUB COLLECTION</span><h1>Công nghệ mới.<br/><em>Trải nghiệm khác biệt.</em></h1>
  <p>Khám phá những thiết bị nổi bật, lựa chọn sản phẩm phù hợp và tận hưởng trải nghiệm mua sắm đơn giản hơn.</p>
  <div className="ph-hero-actions"><a href="#products">Khám phá sản phẩm <b>↗</b></a><Link to="/register">Tạo tài khoản</Link></div>
  <div className="ph-proof"><span>★★★★★</span> Không gian mua sắm công nghệ của bạn</div>
</div><div className="ph-hero-art"><div className="ph-glow"/><div className="ph-ring"/><div className="ph-phone ph-phone-back"><i/><i/><i/></div><div className="ph-phone ph-phone-front"><small>PHONEHUB</small><b>MAKE IT<br/>SMART.</b><i/></div><div className="ph-float"><i/><span><b>New collection</b><small>Discover your next device</small></span><strong>↗</strong></div></div><div className="ph-hero-index">01 ━ SMARTER EVERY DAY</div></section>}
