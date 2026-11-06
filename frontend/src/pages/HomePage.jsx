import { useMemo, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import HeroBanner from '../components/home/HeroBanner.jsx';
import CategoryList from '../components/home/CategoryList.jsx';
import ProductSection from '../components/home/ProductSection.jsx';
import './HomePage.css';

const products = [
  { id: 1, name: 'iPhone 16 Pro', brand: 'Apple', category: 'iPhone', price: 28990000, oldPrice: 31990000, tag: 'Nổi bật', image: 'https://images.unsplash.com/photo-1696446892353-3f6f6f9c5b4b?auto=format&fit=crop&w=900&q=85', description: 'Thiết kế cao cấp · Camera chuyên nghiệp' },
  { id: 2, name: 'Samsung Galaxy S25', brand: 'Samsung', category: 'Samsung', price: 21990000, oldPrice: 23990000, tag: 'Mới', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=85', description: 'Màn hình sống động · Hiệu năng mạnh' },
  { id: 3, name: 'Xiaomi 14T Pro', brand: 'Xiaomi', category: 'Xiaomi', price: 14990000, oldPrice: 16990000, tag: 'Giá tốt', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85', description: 'Sạc nhanh · Trải nghiệm mượt mà' },
  { id: 4, name: 'OPPO Reno Series', brand: 'OPPO', category: 'OPPO', price: 10990000, oldPrice: 11990000, tag: '', image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=85', description: 'Thiết kế thời trang · Chụp ảnh đẹp' },
];
const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [cartCount, setCartCount] = useState(0);
  const visibleProducts = useMemo(() => products.filter((p) => {
    const categoryMatch = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const keyword = searchTerm.trim().toLocaleLowerCase('vi');
    return categoryMatch && (!keyword || `${p.name} ${p.brand} ${p.category}`.toLocaleLowerCase('vi').includes(keyword));
  }), [searchTerm, selectedCategory]);

  return <div className="home-page">
    <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} cartCount={cartCount} />
    <main className="home-main">
      <HeroBanner />
      <CategoryList selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      <ProductSection title={searchTerm ? 'Kết quả tìm kiếm' : 'Điện thoại nổi bật'}
        subtitle={searchTerm ? `Sản phẩm phù hợp với “${searchTerm}”` : 'Lựa chọn công nghệ đáng chú ý dành cho bạn'}
        products={visibleProducts} formatPrice={formatPrice}
        onAddToCart={() => setCartCount((n) => n + 1)} />
      <section className="home-benefits">
        <div><b>✓</b><span><strong>Sản phẩm chính hãng</strong><small>Nguồn gốc rõ ràng</small></span></div>
        <div><b>↻</b><span><strong>Đổi trả thuận tiện</strong><small>Hỗ trợ theo chính sách</small></span></div>
        <div><b>♧</b><span><strong>Hỗ trợ tận tâm</strong><small>Luôn sẵn sàng giải đáp</small></span></div>
      </section>
    </main>
    <Footer />
  </div>;
}
