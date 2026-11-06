import { useState } from "react";
import { uploadApi } from "../api/services";
import Alert from "./Alert";
import FileUploadButton from "./FileUploadButton";
import { MAX_FILE_MB, RESOURCE_ACCEPT, RESOURCE_TYPES, formatBytes } from "../utils/constants";
import { validateLesson } from "../utils/validation";
import { getYouTubeEmbedUrl } from "../utils/youtube";

const toForm = (lesson) => ({
  title: lesson?.title || "",
  videoUrl: lesson?.videoUrl || "",
  content: lesson?.content || "",
  durationSeconds: String(lesson?.durationSeconds ?? 0),
  isPreview: Boolean(lesson?.isPreview),
  resources: (lesson?.resources || []).map((r) => ({ name: r.name, type: r.type, url: r.url, sizeBytes: r.sizeBytes || 0 })),
});

// Tạo payload đúng các trường mà lesson.service.js cho phép.
const toLessonPayload = (form) => ({
  title: form.title.trim(),
  videoUrl: form.videoUrl.trim(),
  content: form.content,
  durationSeconds: Number(form.durationSeconds),
  isPreview: form.isPreview,
  resources: form.resources.map((r) => ({
    name: r.name.trim(),
    type: r.type,
    url: r.url.trim(),
    sizeBytes: Number(r.sizeBytes) || 0,
  })),
});

export default function LessonForm({ lesson, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(lesson));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const embedUrl = getYouTubeEmbedUrl(form.videoUrl);

  const updateResource = (index, field, value) =>
    setForm({ ...form, resources: form.resources.map((r, i) => (i === index ? { ...r, [field]: value } : r)) });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateLesson(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(toLessonPayload(form));
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <form className="lesson-form" onSubmit={handleSubmit} noValidate aria-label="Biểu mẫu bài học">
      <Alert>{error}</Alert>
      <label>
        Tiêu đề bài học *
        <input value={form.title} maxLength={180} onChange={update("title")} />
      </label>
      <div className="form-row">
        <label>
          Video URL
          <input value={form.videoUrl} placeholder="https://..." onChange={update("videoUrl")} />
        </label>
        <label>
          Thời lượng (giây)
          <input type="number" min={0} value={form.durationSeconds} onChange={update("durationSeconds")} />
        </label>
      </div>
      {embedUrl ? (
        <iframe
          className="video-preview"
          src={embedUrl}
          title="Xem trước video YouTube"
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        form.videoUrl.trim() && <p className="muted small">Không nhận diện được link YouTube — sẽ lưu như link video thường.</p>
      )}
      <label>
        Nội dung
        <textarea rows={4} value={form.content} onChange={update("content")} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={form.isPreview} onChange={update("isPreview")} />
        Cho phép xem trước (preview)
      </label>

      <fieldset>
        <legend>Tài liệu đính kèm</legend>
        {form.resources.map((r, index) => (
          <div className="resource-row" key={index}>
            <input
              aria-label={`Tên tài liệu ${index + 1}`}
              placeholder="Tên"
              value={r.name}
              onChange={(e) => updateResource(index, "name", e.target.value)}
            />
            <select value={r.type} onChange={(e) => updateResource(index, "type", e.target.value)}>
              {RESOURCE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input
              aria-label={`URL tài liệu ${index + 1}`}
              placeholder="https://..."
              value={r.url}
              onChange={(e) => updateResource(index, "url", e.target.value)}
            />
            <span className="muted small">{r.sizeBytes > 0 ? formatBytes(r.sizeBytes) : ""}</span>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              aria-label={`Xóa tài liệu ${index + 1}`}
              onClick={() => setForm({ ...form, resources: form.resources.filter((_, i) => i !== index) })}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="actions">
          <FileUploadButton
            label="Tải file lên"
            accept={RESOURCE_ACCEPT}
            maxSizeMb={MAX_FILE_MB}
            upload={uploadApi.file}
            onUploaded={(resource) => setForm((current) => ({ ...current, resources: [...current.resources, resource] }))}
            onError={setError}
          />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setForm({ ...form, resources: [...form.resources, { name: "", type: "pdf", url: "", sizeBytes: 0 }] })}
          >
            + Thêm link tài liệu
          </button>
          <span className="muted small">PDF, Word, PowerPoint, Excel, ZIP, RAR, TXT · tối đa {MAX_FILE_MB}MB</span>
        </div>
      </fieldset>

      <div className="actions">
        <button className="btn btn-primary" disabled={submitting}>
          {lesson ? "Lưu bài học" : "Thêm bài học"}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
}
