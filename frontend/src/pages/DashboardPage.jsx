import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { categoryApi, courseApi, tagApi } from "../api/services";
import { useAuth } from "../context/auth-context";
import { COURSE_STATUS_LABELS, formatPrice } from "../utils/constants";
import Alert from "../components/Alert";

const getTotal = (response, rows = []) => response?.pagination?.total ?? response?.data?.length ?? rows.length;

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ courses: [], courseTotal: 0, categoryTotal: 0, tagTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const courseRequest = user.role === "instructor" ? courseApi.mine({ page: 1, limit: 5 }) : courseApi.list({ page: 1, limit: 5 });
        const requests = [courseRequest];
        if (user.role !== "instructor") requests.push(categoryApi.list({ page: 1, limit: 1 }));
        if (user.role === "admin") requests.push(tagApi.list({ page: 1, limit: 1 }));
        const results = await Promise.all(requests);
        if (!alive) return;
        const courseRes = results[0];
        const categoryRes = user.role !== "instructor" ? results[1] : null;
        const tagRes = user.role === "admin" ? results[2] : null;
        setData({
          courses: courseRes.data || [],
          courseTotal: getTotal(courseRes, courseRes.data || []),
          categoryTotal: categoryRes ? getTotal(categoryRes, categoryRes.data || []) : 0,
          tagTotal: tagRes ? getTotal(tagRes, tagRes.data || []) : 0,
        });
      } catch (err) {
        if (alive) setError(getErrorMessage(err, "Không thể tải dữ liệu tổng quan."));
      } finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [user.role]);

  const stats = useMemo(() => {
    if (user.role === "admin") return [
      { label: "Tổng khóa học", value: data.courseTotal, note: "Trong hệ thống", icon: "▤" },
      { label: "Danh mục", value: data.categoryTotal, note: "Dữ liệu phân loại", icon: "▧" },
      { label: "Thẻ khóa học", value: data.tagTotal, note: "Tags đang quản lý", icon: "◇" },
    ];
    if (user.role === "instructor") return [
      { label: "Khóa học của tôi", value: data.courseTotal, note: "Tổng số khóa học", icon: "▤" },
      { label: "Đã xuất bản", value: data.courses.filter((c) => c.status === "published").length, note: "Trong 5 khóa học gần nhất", icon: "✓" },
      { label: "Bản nháp", value: data.courses.filter((c) => c.status === "draft").length, note: "Trong 5 khóa học gần nhất", icon: "✎" },
    ];
    return [
      { label: "Khóa học hiện có", value: data.courseTotal, note: "Khóa học đã xuất bản", icon: "▤" },
      { label: "Danh mục", value: data.categoryTotal, note: "Chủ đề học tập", icon: "▧" },
    ];
  }, [data, user.role]);

  const greeting = user.role === "admin" ? "Quản trị hệ thống" : user.role === "instructor" ? "Không gian giảng viên" : "Không gian học tập";

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div><span className="eyebrow">ORBITLEARN WORKSPACE</span><h1>{greeting}, {user.fullName?.split(" ").slice(-1)[0]}!</h1><p>Quản lý hoạt động học tập và nội dung khóa học của bạn tại một nơi.</p></div>
        <div className="welcome-art" aria-hidden="true"><span className="art-orbit orbit-one"/><span className="art-orbit orbit-two"/><span className="art-core">O</span></div>
        {user.role === "instructor" && <Link to="/courses/new" className="btn welcome-action">＋ Tạo khóa học</Link>}
        {user.role === "student" && <Link to="/courses" className="btn welcome-action">Khám phá khóa học →</Link>}
      </section>

      <Alert>{error}</Alert>
      <div className="section-heading"><div><span className="eyebrow">OVERVIEW</span><h2>Tổng quan</h2></div><span className="muted small">Dữ liệu từ hệ thống</span></div>
      <div className="stats-grid">
        {stats.map((stat) => <article className="stat-card" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className="stat-icon">{stat.icon}</span></div><strong>{loading ? "—" : stat.value}</strong><small>{stat.note}</small></article>)}
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">CONTENT</span><h2>{user.role === "instructor" ? "Khóa học gần đây" : "Khóa học mới nhất"}</h2></div><Link to={user.role === "instructor" ? "/my-courses" : "/courses"} className="text-link">Xem tất cả <span>→</span></Link></div>
        {loading ? <div className="skeleton-list"><i/><i/><i/></div> : data.courses.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><strong>Chưa có khóa học nào</strong><p>{user.role === "instructor" ? "Bắt đầu bằng cách tạo khóa học đầu tiên của bạn." : "Hiện chưa có khóa học phù hợp để hiển thị."}</p>{user.role === "instructor" && <Link className="btn btn-primary" to="/courses/new">Tạo khóa học</Link>}</div> : <div className="dashboard-course-list">{data.courses.map((course) => <Link to={`/courses/${course._id}`} className="dashboard-course-row" key={course._id}><div className="mini-course-cover">{course.coverImageUrl ? <img src={course.coverImageUrl} alt=""/> : <span>{course.title?.charAt(0)}</span>}</div><div className="dashboard-course-info"><strong>{course.title}</strong><small>{course.category?.name || "Chưa phân loại"}</small></div><span className={`badge status-${course.status}`}>{COURSE_STATUS_LABELS[course.status] || course.status}</span><strong className="course-row-price">{formatPrice(course.price)}</strong><span className="row-arrow">→</span></Link>)}</div>}
      </section>

      <section className="quick-links"><div><span className="eyebrow">SHORTCUTS</span><h2>Truy cập nhanh</h2></div><div className="quick-link-grid">
        {(user.role === "admin" ? [{to:"/courses",title:"Quản lý khóa học",desc:"Theo dõi và quản trị nội dung",icon:"▤"},{to:"/categories",title:"Danh mục",desc:"Tổ chức chủ đề khóa học",icon:"▧"},{to:"/tags",title:"Thẻ khóa học",desc:"Quản lý tag và phân loại",icon:"◇"}] : user.role === "instructor" ? [{to:"/my-courses",title:"Khóa học của tôi",desc:"Quản lý nội dung giảng dạy",icon:"▤"},{to:"/courses/new",title:"Tạo khóa học",desc:"Xây dựng khóa học mới",icon:"＋"},{to:"/profile",title:"Hồ sơ cá nhân",desc:"Thông tin tài khoản",icon:"◉"}] : [{to:"/courses",title:"Khám phá khóa học",desc:"Tìm nội dung muốn học",icon:"▤"},{to:"/categories",title:"Danh mục",desc:"Khám phá theo chủ đề",icon:"▧"},{to:"/profile",title:"Tài khoản",desc:"Thông tin cá nhân",icon:"◉"}]).map((item) => <Link to={item.to} className="quick-link-card" key={item.to}><span className="quick-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.desc}</small></span><b>↗</b></Link>)}
      </div></section>
    </div>
  );
}
