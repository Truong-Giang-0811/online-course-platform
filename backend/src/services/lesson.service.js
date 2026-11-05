import mongoose from "mongoose";
import { Section, Lesson, LessonProgress, LessonQuestion } from "../models/index.js";

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const checkEditable = (course, user) => {
  if (user.role !== "admin" && !["draft", "rejected"].includes(course.status)) {
    fail("Giảng viên chỉ được sửa bài học khi khóa học ở trạng thái draft hoặc rejected.", 403);
  }
};

const checkId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) fail(`${label} không hợp lệ.`);
};

const findSection = async (course, sectionId) => {
  checkId(sectionId, "sectionId");
  const section = await Section.findOne({ _id: sectionId, course: course._id });
  if (!section) fail("Không tìm thấy chương thuộc khóa học này.", 404);
  return section;
};

const findLesson = async (course, section, lessonId) => {
  checkId(lessonId, "lessonId");
  const lesson = await Lesson.findOne({ _id: lessonId, course: course._id, section: section._id });
  if (!lesson) fail("Không tìm thấy bài học trong chương này.", 404);
  return lesson;
};

const validateText = (value, label, limit, required = false) => {
  if (typeof value !== "string") fail(`${label} phải là chuỗi ký tự.`);
  const trimmed = value.trim();
  if (required && !trimmed) fail(`${label} không được để trống.`);
  if (trimmed.length > limit) fail(`${label} không được vượt quá ${limit} ký tự.`);
  return trimmed;
};

const validateUrl = (value, label, required = false) => {
  const url = validateText(value, label, 2048, required);
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error();
    } catch { fail(`${label} phải là URL http/https hợp lệ.`); }
  }
  return url;
};

const resourceTypes = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar", "txt", "other"]);
const validateResources = (resources) => {
  if (!Array.isArray(resources)) fail("resources phải là một mảng.");
  if (resources.length > 100) fail("Một bài học chỉ được có tối đa 100 tài liệu.");
  return resources.map((r, index) => {
    if (!r || typeof r !== "object" || Array.isArray(r)) fail(`Tài liệu thứ ${index + 1} không hợp lệ.`);
    const name = validateText(r.name, `Tên tài liệu ${index + 1}`, 255, true);
    if (!resourceTypes.has(r.type)) fail(`Loại tài liệu thứ ${index + 1} không hợp lệ.`);
    const url = validateUrl(r.url, `URL tài liệu ${index + 1}`, true);
    const sizeBytes = r.sizeBytes === undefined ? 0 : r.sizeBytes;
    if (typeof sizeBytes !== "number" || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
      fail(`sizeBytes của tài liệu thứ ${index + 1} phải là số nguyên không âm.`);
    }
    return { name, type: r.type, url, sizeBytes };
  });
};

const allowedFields = new Set(["title", "videoUrl", "content", "resources", "durationSeconds", "isPreview"]);
const parseData = (data, creating = false) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) fail("Dữ liệu bài học không hợp lệ.");
  const keys = Object.keys(data);
  if (!keys.length) fail("Cần cung cấp ít nhất một trường để cập nhật.");
  if (keys.some((key) => !allowedFields.has(key))) {
    fail("Dữ liệu chứa trường không được phép. Thứ tự được cập nhật qua API /reorder.");
  }
  if (creating && !Object.hasOwn(data, "title")) fail("Vui lòng nhập tiêu đề bài học.");
  const result = {};
  if (Object.hasOwn(data, "title")) result.title = validateText(data.title, "Tiêu đề bài học", 180, true);
  if (Object.hasOwn(data, "videoUrl")) result.videoUrl = validateUrl(data.videoUrl, "videoUrl");
  if (Object.hasOwn(data, "content")) result.content = validateText(data.content, "Nội dung", 200000);
  if (Object.hasOwn(data, "resources")) result.resources = validateResources(data.resources);
  if (Object.hasOwn(data, "durationSeconds")) {
    if (typeof data.durationSeconds !== "number" || !Number.isSafeInteger(data.durationSeconds) || data.durationSeconds < 0) {
      fail("durationSeconds phải là số nguyên không âm.");
    }
    result.durationSeconds = data.durationSeconds;
  }
  if (Object.hasOwn(data, "isPreview")) {
    if (typeof data.isPreview !== "boolean") fail("isPreview phải là true hoặc false.");
    result.isPreview = data.isPreview;
  }
  return result;
};

const list = (courseId, sectionId) => Lesson.find({ course: courseId, section: sectionId })
  .sort({ order: 1, createdAt: 1, _id: 1 }).lean();

const normalizeOrders = async (courseId, sectionId) => {
  const lessons = await Lesson.find({ course: courseId, section: sectionId })
    .sort({ order: 1, createdAt: 1, _id: 1 }).select("_id order");
  const updates = lessons.flatMap((lesson, index) => lesson.order === index ? [] : [{
    updateOne: { filter: { _id: lesson._id, course: courseId, section: sectionId }, update: { $set: { order: index } } },
  }]);
  if (updates.length) await Lesson.bulkWrite(updates);
  return lessons.length;
};

export const listLessons = async (course, sectionId) => {
  const section = await findSection(course, sectionId);
  return list(course._id, section._id);
};

export const getLessonById = async (course, sectionId, lessonId) => {
  const section = await findSection(course, sectionId);
  return findLesson(course, section, lessonId);
};

export const createLesson = async (course, sectionId, data, user) => {
  checkEditable(course, user);
  const section = await findSection(course, sectionId);
  const values = parseData(data, true);
  const nextOrder = await normalizeOrders(course._id, section._id);
  return Lesson.create({ ...values, course: course._id, section: section._id, order: nextOrder });
};

export const updateLesson = async (course, sectionId, lessonId, data, user) => {
  checkEditable(course, user);
  const section = await findSection(course, sectionId);
  const lesson = await findLesson(course, section, lessonId);
  const values = parseData(data);
  lesson.set(values);
  return lesson.save();
};

export const deleteLesson = async (course, sectionId, lessonId, user) => {
  checkEditable(course, user);
  const section = await findSection(course, sectionId);
  const lesson = await findLesson(course, section, lessonId);
  const [progress, questions] = await Promise.all([
    LessonProgress.exists({ lesson: lesson._id }),
    LessonQuestion.exists({ lesson: lesson._id }),
  ]);
  if (progress || questions) {
    fail("Không thể xóa bài học đã có tiến độ học hoặc câu hỏi. Cần xử lý dữ liệu liên quan trước.", 409);
  }
  await lesson.deleteOne();
  await normalizeOrders(course._id, section._id);
  return { lessonId: lesson._id };
};

export const reorderLessons = async (course, sectionId, data, user) => {
  checkEditable(course, user);
  const section = await findSection(course, sectionId);
  const lessonIds = data?.lessonIds;
  if (!Array.isArray(lessonIds) || lessonIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
    fail("lessonIds phải là mảng các ID bài học hợp lệ.");
  }
  const ids = lessonIds.map((id) => id.toLowerCase());
  if (new Set(ids).size !== ids.length) fail("lessonIds không được chứa ID trùng lặp.");
  const existing = await Lesson.find({ course: course._id, section: section._id }).select("_id").lean();
  const valid = new Set(existing.map((lesson) => String(lesson._id)));
  if (ids.length !== existing.length || ids.some((id) => !valid.has(id))) {
    fail("lessonIds phải chứa đúng và đủ tất cả bài học thuộc chương này.");
  }
  if (ids.length) {
    await Lesson.bulkWrite(ids.map((id, index) => ({
      updateOne: { filter: { _id: id, course: course._id, section: section._id }, update: { $set: { order: index } } },
    })));
  }
  return list(course._id, section._id);
};
