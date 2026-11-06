import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { categoryApi } from "../api/services";
import Alert from "../components/Alert";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/auth-context";

const EMPTY_FORM = { name: "", description: "" };

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [filters, setFilters] = useState({ keyword: "", isActive: "", sortBy: "createdAt", sortOrder: "desc", page: 1 });
  const [keywordInput, setKeywordInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  // Tăng reloadKey để tải lại danh sách sau khi thêm/sửa/xóa.
  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let ignore = false;
    const params = { ...filters, limit: 10 };
    if (!params.keyword) delete params.keyword;
    if (params.isActive === "") delete params.isActive;
    categoryApi
      .list(params)
      .then((res) => {
        if (ignore) return;
        setCategories(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [filters, reloadKey]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Tên danh mục là bắt buộc.");
      return;
    }
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      const res = editingId ? await categoryApi.update(editingId, payload) : await categoryApi.create(payload);
      setNotice(res.message);
      resetForm();
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const runAction = async (action) => {
    setNotice("");
    setError("");
    try {
      const res = await action();
      setNotice(res.message);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setForm({ name: category.name, description: category.description || "" });
    setFormError("");
  };

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Danh mục khóa học</h1>
      </div>

      {isAdmin && (
        <form className="card form-inline-grid" onSubmit={handleSubmit} aria-label="Biểu mẫu danh mục">
          <h2>{editingId ? "Sửa danh mục" : "Thêm danh mục"}</h2>
          <Alert>{formError}</Alert>
          <label>
            Tên danh mục
            <input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Mô tả
            <textarea
              rows={2}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary">{editingId ? "Lưu thay đổi" : "Thêm danh mục"}</button>
            {editingId && (
              <button type="button" className="btn" onClick={resetForm}>
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ ...filters, keyword: keywordInput.trim(), page: 1 });
        }}
      >
        <input placeholder="Tìm theo tên hoặc mô tả..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
        {isAdmin && (
          <select
            aria-label="Lọc trạng thái"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Ngừng hoạt động</option>
          </select>
        )}
        <select
          aria-label="Sắp xếp"
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(":");
            setFilters({ ...filters, sortBy, sortOrder, page: 1 });
          }}
        >
          <option value="createdAt:desc">Mới nhất</option>
          <option value="createdAt:asc">Cũ nhất</option>
          <option value="name:asc">Tên A → Z</option>
          <option value="name:desc">Tên Z → A</option>
        </select>
        <button className="btn">Tìm</button>
      </form>

      <Alert type="success">{notice}</Alert>
      <Alert>{error}</Alert>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : categories.length === 0 ? (
        <p className="muted">Chưa có danh mục nào.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Slug</th>
              <th>Mô tả</th>
              {isAdmin && <th>Trạng thái</th>}
              {isAdmin && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td>{category.name}</td>
                <td className="muted">{category.slug}</td>
                <td>{category.description}</td>
                {isAdmin && (
                  <td>
                    <span className={`badge ${category.isActive ? "badge-green" : "badge-gray"}`}>
                      {category.isActive ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                )}
                {isAdmin && (
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => startEdit(category)}>
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => runAction(() => categoryApi.setStatus(category._id, !category.isActive))}
                    >
                      {category.isActive ? "Ngừng" : "Kích hoạt"}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
                          runAction(() => categoryApi.remove(category._id));
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination pagination={pagination} onChange={(page) => setFilters({ ...filters, page })} />
    </div>
  );
}
