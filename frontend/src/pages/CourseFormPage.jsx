import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { categoryApi, courseApi, tagApi, uploadApi } from "../api/services";
import Alert from "../components/Alert";
import FileUploadButton from "../components/FileUploadButton";
import { IMAGE_ACCEPT, MAX_IMAGE_MB } from "../utils/constants";
import { useAuth } from "../context/auth-context";
import { validateCourse } from "../utils/validation";

const EMPTY = { title: "", description: "", coverImageUrl: "", category: "", price: "0", instructor: "" };

export default function CourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      categoryApi.list({ limit: 50, sortBy: "name", sortOrder: "asc", ...(user.role === "admin" ? { isActive: true } : {}) }),
      tagApi.list({ limit: 50, isActive: true, sortBy: "name", sortOrder: "asc" }),
    ])
      .then(([categoryResult, tagResult]) => {
        setCategories(categoryResult.data);
        setTags(tagResult.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    courseApi
      .get(id)
      .then((res) => {
        const c = res.data;
        setForm({
          title: c.title,
          description: c.description,
          coverImageUrl: c.coverImageUrl || "",
          category: c.category?._id || "",
          price: String(c.price ?? 0),
          instructor: c.instructor?._id || "",
        });
        setSelectedTags((c.tags || []).map((tag) => tag._id || tag));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateCourse(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isEdit && user.role === "admin" && !form.instructor.trim()) {
      setError("Vui lòng cung cấp Instructor ID.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      category: form.category,
      tags: selectedTags,
      price: Number(form.price),
    };
    if (!isEdit && user.role === "admin") payload.instructor = form.instructor.trim();

    setSubmitting(true);
    setError("");
    try {
      const res = isEdit ? await courseApi.update(id, payload) : await courseApi.create(payload);
      navigate(`/courses/${res.data._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="muted">Đang tải...</p>;

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h1>{isEdit ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h1>
      <Alert>{error}</Alert>
      <label>
        Tiêu đề *
        <input value={form.title} maxLength={180} onChange={update("title")} />
      </label>
      <label>
        Mô tả *
        <textarea rows={5} value={form.description} onChange={update("description")} />
      </label>
      <div className="field">
        <label>
          Ảnh bìa (URL)
          <input value={form.coverImageUrl} placeholder="https://..." onChange={update("coverImageUrl")} />
        </label>
        <div className="actions">
          <FileUploadButton
            label="Tải ảnh lên"
            accept={IMAGE_ACCEPT}
            maxSizeMb={MAX_IMAGE_MB}
            upload={uploadApi.image}
            onUploaded={(data) => setForm((current) => ({ ...current, coverImageUrl: data.url }))}
            onError={setError}
          />
          <span className="muted small">JPG, PNG, WEBP, GIF · tối đa {MAX_IMAGE_MB}MB</span>
        </div>
        {form.coverImageUrl && <img className="cover-preview" src={form.coverImageUrl} alt="Xem trước ảnh bìa" />}
      </div>
      <div className="field">
        <span className="label">Tag khóa học</span>
        {tags.length === 0 ? (
          <p className="muted small">Chưa có Tag đang hoạt động. Admin có thể tạo Tag trong mục Quản lý Tag.</p>
        ) : (
          <div className="tags" role="group" aria-label="Chọn Tag cho khóa học">
            {tags.map((tag) => (
              <label key={tag._id} className="tag-option">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag._id)}
                  onChange={(event) => {
                    setSelectedTags((current) =>
                      event.target.checked
                        ? [...current, tag._id]
                        : current.filter((id) => id !== tag._id)
                    );
                  }}
                />
                <span>#{tag.name}</span>
              </label>
            ))}
          </div>
        )}
        <span className="muted small">Có thể chọn nhiều Tag để giúp học viên tìm kiếm khóa học.</span>
      </div>
      <div className="form-row">
        <label>
          Danh mục *
          <select value={form.category} onChange={update("category")}>
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Giá (VNĐ)
          <input type="number" min={0} value={form.price} onChange={update("price")} />
        </label>
      </div>
      {!isEdit && user.role === "admin" && (
        <label>
          Instructor ID *
          <input value={form.instructor} placeholder="ObjectId của giảng viên đã được duyệt" onChange={update("instructor")} />
        </label>
      )}
      <div className="actions">
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
        </button>
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          Hủy
        </button>
      </div>
    </form>
  );
}
