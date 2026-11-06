import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { categoryApi, courseApi } from "../api/services";
import Alert from "../components/Alert";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/auth-context";
import { COURSE_STATUS_LABELS, formatPrice } from "../utils/constants";

// mine = true: dùng GET /courses/mine (chỉ giảng viên).
export default function CoursesPage({ mine = false }) {
  const { user } = useAuth();
  const canFilterStatus = user.role !== "student";
  const canCreate = user.role === "instructor" || user.role === "admin";

  const [filters, setFilters] = useState({ keyword: "", category: "", status: "", page: 1 });
  const [keywordInput, setKeywordInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    categoryApi
      .list({ limit: 50, sortBy: "name", sortOrder: "asc" })
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    const params = Object.fromEntries(Object.entries({ ...filters, limit: 9 }).filter(([, v]) => v !== ""));
    (mine ? courseApi.mine(params) : courseApi.list(params))
      .then((res) => {
        if (ignore) return;
        setCourses(res.data);
        setPagination(res.pagination);
        setError("");
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [filters, mine]);

  const title = mine ? "Khóa học của tôi" : user.role === "instructor" ? "Khóa học (của tôi)" : "Khóa học";

  return (
    <div className="stack">
      <div className="page-header">
        <h1>{title}</h1>
        {canCreate && (
          <Link to="/courses/new" className="btn btn-primary">
            + Tạo khóa học
          </Link>
        )}
      </div>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ ...filters, keyword: keywordInput.trim(), page: 1 });
        }}
      >
        <input placeholder="Tìm theo tiêu đề, mô tả..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
        <select
          aria-label="Lọc danh mục"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {canFilterStatus && (
          <select
            aria-label="Lọc trạng thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="published">Đã xuất bản</option>
          </select>
        )}
        <button className="btn">Tìm</button>
      </form>

      <Alert>{error}</Alert>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : courses.length === 0 ? (
        <p className="muted">Không tìm thấy khóa học nào.</p>
      ) : (
        <div className="grid">
          {courses.map((course) => (
            <Link key={course._id} to={`/courses/${course._id}`} className="course-card">
              <div className="course-cover">
                {course.coverImageUrl ? <img src={course.coverImageUrl} alt="" /> : <span>{course.title.charAt(0)}</span>}
              </div>
              <div className="course-body">
                <div className="row-between">
                  <span className="muted small">{course.category?.name}</span>
                  {canFilterStatus && (
                    <span className={`badge status-${course.status}`}>{COURSE_STATUS_LABELS[course.status]}</span>
                  )}
                </div>
                <h3>{course.title}</h3>
                <p className="muted small">{course.instructor?.fullName}</p>
                <strong>{formatPrice(course.price)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onChange={(page) => setFilters({ ...filters, page })} />
    </div>
  );
}
