import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { tagApi } from "../api/services";
import Alert from "../components/Alert";
import Pagination from "../components/Pagination";

const EMPTY_FORM = { name: "" };

export default function TagsPage() {
  const [filters, setFilters] = useState({
    keyword: "",
    isActive: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const params = { ...filters, limit: 10 };
    if (!params.keyword) delete params.keyword;
    if (params.isActive === "") delete params.isActive;

    tagApi
      .list(params)
      .then((res) => {
        if (ignore) return;
        setTags(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Tên Tag là bắt buộc.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setNotice("");
    try {
      const payload = { name: form.name.trim() };
      const result = editingId
        ? await tagApi.update(editingId, payload)
        : await tagApi.create(payload);
      setNotice(result.message);
      resetForm();
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (action) => {
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (tag) => {
    setEditingId(tag._id);
    setForm({ name: tag.name });
    setFormError("");
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Quản lý Tag</h1>
          <p className="muted">Quản lý thẻ chủ đề dùng để phân loại và tìm kiếm khóa học.</p>
        </div>
      </div>

      <form className="card form-inline-grid" onSubmit={handleSubmit} aria-label="Biểu mẫu Tag">
        <h2>{editingId ? "Cập nhật Tag" : "Thêm Tag mới"}</h2>
        <Alert>{formError}</Alert>
        <label>
          Tên Tag
          <input
            value={form.name}
            maxLength={60}
            placeholder="Ví dụ: JavaScript, Node.js, Frontend"
            onChange={(event) => setForm({ name: event.target.value })}
          />
        </label>
        <div className="actions">
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm Tag"}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Hủy
            </button>
          )}
        </div>
      </form>

      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ ...filters, keyword: keywordInput.trim(), page: 1 });
        }}
      >
        <input
          placeholder="Tìm theo tên Tag..."
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
        <select
          aria-label="Lọc trạng thái Tag"
          value={filters.isActive}
          onChange={(event) => setFilters({ ...filters, isActive: event.target.value, page: 1 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Ngừng hoạt động</option>
        </select>
        <select
          aria-label="Sắp xếp Tag"
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
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
      ) : tags.length === 0 ? (
        <p className="muted">Chưa có Tag nào.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tên Tag</th>
                <th>Slug</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag._id}>
                  <td>{tag.name}</td>
                  <td className="muted">{tag.slug}</td>
                  <td>{new Date(tag.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <span className={`badge ${tag.isActive === false ? "badge-gray" : "badge-green"}`}>
                      {tag.isActive === false ? "Ngừng hoạt động" : "Hoạt động"}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => startEdit(tag)}>
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        runAction(() => tagApi.setStatus(tag._id, tag.isActive === false))
                      }
                    >
                      {tag.isActive === false ? "Kích hoạt" : "Ngừng"}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm(`Xóa Tag "${tag.name}"?`)) {
                          runAction(() => tagApi.remove(tag._id));
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onChange={(page) => setFilters({ ...filters, page })} />
    </div>
  );
}
