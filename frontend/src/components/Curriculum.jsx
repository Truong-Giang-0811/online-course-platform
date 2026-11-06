import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { lessonApi, sectionApi } from "../api/services";
import Alert from "./Alert";
import LessonForm from "./LessonForm";
import { formatDuration } from "../utils/constants";
import { getYouTubeId } from "../utils/youtube";

// Hoán đổi phần tử index với index + delta, trả về mảng ID theo thứ tự mới.
const moveIds = (items, index, delta) => {
  const ids = items.map((item) => item._id);
  const target = index + delta;
  if (target < 0 || target >= ids.length) return null;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
};

function SectionItem({ courseId, section, index, total, editable, onChanged, onError, onMove }) {
  const [lessons, setLessons] = useState([]);
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(section.title);
  // null: không mở form; "new": thêm bài học; lessonId: sửa bài học.
  const [lessonFormFor, setLessonFormFor] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);
  const loadLessons = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let ignore = false;
    lessonApi
      .list(courseId, section._id)
      .then((res) => !ignore && setLessons(res.data))
      .catch((err) => !ignore && onError(getErrorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [courseId, section._id, onError, reloadKey]);

  const run = async (action, after = loadLessons) => {
    try {
      await action();
      await after();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  };

  const saveTitle = async (e) => {
    e.preventDefault();
    await run(() => sectionApi.update(courseId, section._id, { title }), onChanged);
    setRenaming(false);
  };

  return (
    <li className="section-item">
      <div className="section-head">
        {renaming ? (
          <form className="inline-form" onSubmit={saveTitle}>
            <input aria-label="Tên chương" value={title} maxLength={180} onChange={(e) => setTitle(e.target.value)} />
            <button className="btn btn-sm btn-primary">Lưu</button>
            <button type="button" className="btn btn-sm" onClick={() => setRenaming(false)}>
              Hủy
            </button>
          </form>
        ) : (
          <button type="button" className="section-title" onClick={() => setOpen(!open)}>
            {open ? "▾" : "▸"} Chương {index + 1}: {section.title}
            <span className="muted small"> · {lessons.length} bài</span>
          </button>
        )}
        {editable && !renaming && (
          <div className="actions">
            <button className="btn btn-sm" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Đưa chương lên">
              ↑
            </button>
            <button className="btn btn-sm" disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label="Đưa chương xuống">
              ↓
            </button>
            <button className="btn btn-sm" onClick={() => setRenaming(true)}>
              Đổi tên
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => window.confirm("Xóa chương này?") && run(() => sectionApi.remove(courseId, section._id), onChanged)}
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      {open && (
        <ul className="lesson-list">
          {lessons.map((lesson, lessonIndex) =>
            lessonFormFor === lesson._id ? (
              <li key={lesson._id}>
                <LessonForm
                  lesson={lesson}
                  onCancel={() => setLessonFormFor(null)}
                  onSubmit={async (payload) => {
                    await lessonApi.update(courseId, section._id, lesson._id, payload);
                    setLessonFormFor(null);
                    loadLessons();
                  }}
                />
              </li>
            ) : (
              <li key={lesson._id} className="lesson-item">
                <span>
                  {lessonIndex + 1}. {lesson.title}
                  {lesson.isPreview && <span className="badge badge-green">Preview</span>}
                  {getYouTubeId(lesson.videoUrl) && (
                    <a className="badge" href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      ▶ YouTube
                    </a>
                  )}
                  <span className="muted small"> · {formatDuration(lesson.durationSeconds)}</span>
                  {lesson.resources?.length > 0 && <span className="muted small"> · {lesson.resources.length} tài liệu</span>}
                </span>
                {editable && (
                  <div className="actions">
                    <button
                      className="btn btn-sm"
                      disabled={lessonIndex === 0}
                      aria-label="Đưa bài học lên"
                      onClick={() => run(() => lessonApi.reorder(courseId, section._id, moveIds(lessons, lessonIndex, -1)))}
                    >
                      ↑
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={lessonIndex === lessons.length - 1}
                      aria-label="Đưa bài học xuống"
                      onClick={() => run(() => lessonApi.reorder(courseId, section._id, moveIds(lessons, lessonIndex, 1)))}
                    >
                      ↓
                    </button>
                    <button className="btn btn-sm" onClick={() => setLessonFormFor(lesson._id)}>
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        window.confirm(`Xóa bài học "${lesson.title}"?`) &&
                        run(() => lessonApi.remove(courseId, section._id, lesson._id))
                      }
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </li>
            )
          )}
          {lessons.length === 0 && <li className="muted small">Chưa có bài học.</li>}
          {editable &&
            (lessonFormFor === "new" ? (
              <li>
                <LessonForm
                  onCancel={() => setLessonFormFor(null)}
                  onSubmit={async (payload) => {
                    await lessonApi.create(courseId, section._id, payload);
                    setLessonFormFor(null);
                    loadLessons();
                  }}
                />
              </li>
            ) : (
              <li>
                <button className="btn btn-sm" onClick={() => setLessonFormFor("new")}>
                  + Thêm bài học
                </button>
              </li>
            ))}
        </ul>
      )}
    </li>
  );
}

export default function Curriculum({ courseId, editable }) {
  const [sections, setSections] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let ignore = false;
    sectionApi
      .list(courseId)
      .then((res) => !ignore && setSections(res.data))
      .catch((err) => !ignore && setError(getErrorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [courseId, reloadKey]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Tên chương không được để trống.");
      return;
    }
    try {
      setError("");
      await sectionApi.create(courseId, { title: newTitle.trim() });
      setNewTitle("");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMove = async (index, delta) => {
    const ids = moveIds(sections, index, delta);
    if (!ids) return;
    try {
      const res = await sectionApi.reorder(courseId, ids);
      setSections(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="card">
      <h2>Nội dung khóa học</h2>
      {!editable && (
        <p className="muted small">Khóa học đã xuất bản — hãy gỡ xuất bản để chỉnh sửa chương và bài học.</p>
      )}
      <Alert>{error}</Alert>
      <ul className="section-list">
        {sections.map((section, index) => (
          <SectionItem
            key={section._id}
            courseId={courseId}
            section={section}
            index={index}
            total={sections.length}
            editable={editable}
            onChanged={load}
            onError={setError}
            onMove={handleMove}
          />
        ))}
      </ul>
      {sections.length === 0 && <p className="muted">Chưa có chương nào.</p>}
      {editable && (
        <form className="inline-form" onSubmit={handleAdd}>
          <input placeholder="Tên chương mới" maxLength={180} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <button className="btn btn-primary">+ Thêm chương</button>
        </form>
      )}
    </div>
  );
}
