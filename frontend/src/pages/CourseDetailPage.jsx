import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { courseApi } from "../api/services";
import Alert from "../components/Alert";
import Curriculum from "../components/Curriculum";
import { useAuth } from "../context/auth-context";
import { COURSE_STATUS_LABELS, formatPrice } from "../utils/constants";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  // Tăng reloadKey để tải lại khóa học sau khi xuất bản/gỡ xuất bản.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    courseApi
      .get(id)
      .then((res) => !ignore && setCourse(res.data))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  if (loading) return <p className="muted">Đang tải...</p>;
  if (!course) return <Alert>{error || "Không tìm thấy khóa học."}</Alert>;

  const isAdmin = user.role === "admin";
  const isOwner = user.role === "instructor" && course.instructor?._id === user.id;
  const canManage = isAdmin || isOwner;
  // Giống backend: giảng viên chỉ sửa khi khóa học ở trạng thái draft/rejected.
  const editable = isAdmin || ["draft", "rejected"].includes(course.status);

  const run = async (action) => {
    setError("");
    setNotice("");
    try {
      const res = await action();
      setNotice(res.message);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa khóa học "${course.title}"? Toàn bộ chương và bài học sẽ bị xóa.`)) return;
    try {
      await courseApi.remove(course._id);
      navigate(user.role === "instructor" ? "/my-courses" : "/courses");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="stack">
      <div className="card course-hero">
        {course.coverImageUrl && <img className="hero-img" src={course.coverImageUrl} alt="" />}
        <div className="stack">
          <div className="row-between">
            <span className="muted">{course.category?.name}</span>
            {canManage && <span className={`badge status-${course.status}`}>{COURSE_STATUS_LABELS[course.status]}</span>}
          </div>
          <h1>{course.title}</h1>
          <p className="muted">Giảng viên: {course.instructor?.fullName}</p>
          {course.tags?.length > 0 && (
            <div className="tags">
              {course.tags.map((t) => (
                <span key={t._id} className="badge">
                  #{t.name}
                </span>
              ))}
            </div>
          )}
          <p className="price">{formatPrice(course.price)}</p>
          <p className="pre-line">{course.description}</p>

          {canManage && (
            <div className="actions">
              {editable && (
                <Link className="btn" to={`/courses/${course._id}/edit`}>
                  Chỉnh sửa
                </Link>
              )}
              {course.status === "published" ? (
                <button className="btn" onClick={() => run(() => courseApi.unpublish(course._id))}>
                  Gỡ xuất bản
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => run(() => courseApi.publish(course._id))}>
                  Xuất bản
                </button>
              )}
              {(isAdmin || course.status === "draft") && (
                <button className="btn btn-danger" onClick={handleDelete}>
                  Xóa khóa học
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Alert type="success">{notice}</Alert>
      <Alert>{error}</Alert>

      {canManage && <Curriculum courseId={course._id} editable={editable} />}
    </div>
  );
}
