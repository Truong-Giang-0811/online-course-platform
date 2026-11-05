import mongoose from "mongoose";
import { Section, Lesson } from "../models/index.js";

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const validateId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) fail(`${label} không hợp lệ.`);
};

const checkEditable = (course, user) => {
  // Đồng bộ chính sách chỉnh sửa nội dung với quản lý khóa học.
  if (user.role !== "admin" && !["draft", "rejected"].includes(course.status)) {
    fail("Giảng viên chỉ được chỉnh sửa chương khi khóa học ở trạng thái draft hoặc rejected.", 403);
  }
};

const validateTitle = (title) => {
  if (typeof title !== "string" || !title.trim()) {
    fail("Tên chương không được để trống.");
  }
  const result = title.trim();
  if (result.length > 180) fail("Tên chương không được vượt quá 180 ký tự.");
  return result;
};

// Gán lại thứ tự liên tiếp bắt đầu từ 0; không ghi đè dữ liệu chương khác.
const normalizeOrders = async (courseId) => {
  const sections = await Section.find({ course: courseId })
    .sort({ order: 1, createdAt: 1, _id: 1 })
    .select("_id order");
  const updates = sections.flatMap((section, index) =>
    section.order === index ? [] : [{
      updateOne: {
        filter: { _id: section._id, course: courseId },
        update: { $set: { order: index } },
      },
    }]
  );
  if (updates.length) await Section.bulkWrite(updates);
  return sections.length;
};

export const listSections = async (course) => {
  return Section.find({ course: course._id })
    .sort({ order: 1, createdAt: 1, _id: 1 })
    .lean();
};

export const createSection = async (course, data, user) => {
  checkEditable(course, user);
  const title = validateTitle(data?.title);
  const count = await normalizeOrders(course._id);
  const section = await Section.create({ course: course._id, title, order: count });
  return section;
};

export const updateSection = async (course, sectionId, data, user) => {
  checkEditable(course, user);
  validateId(sectionId, "sectionId");
  const section = await Section.findOne({ _id: sectionId, course: course._id });
  if (!section) fail("Không tìm thấy chương trong khóa học này.", 404);
  if (!data || !Object.hasOwn(data, "title")) fail("Vui lòng cung cấp tên chương.");
  section.title = validateTitle(data.title);
  await section.save();
  return section;
};

export const deleteSection = async (course, sectionId, user) => {
  checkEditable(course, user);
  validateId(sectionId, "sectionId");
  const section = await Section.findOne({ _id: sectionId, course: course._id });
  if (!section) fail("Không tìm thấy chương trong khóa học này.", 404);
  const hasLessons = await Lesson.exists({ section: section._id });
  if (hasLessons) {
    fail("Không thể xóa chương đang có bài học. Vui lòng chuyển hoặc xóa bài học trước.", 409);
  }
  await section.deleteOne();
  await normalizeOrders(course._id);
  return { sectionId: section._id };
};

// body: { sectionIds: ["id-chuong-1", "id-chuong-2", ...] }
// Danh sách phải có đủ và chỉ gồm các chương thuộc khóa học này.
export const reorderSections = async (course, data, user) => {
  checkEditable(course, user);
  const sectionIds = data?.sectionIds;
  if (!Array.isArray(sectionIds)) fail("sectionIds phải là một mảng.");
  const idStrings = sectionIds.map(String);
  if (idStrings.some((id) => !mongoose.isValidObjectId(id))) {
    fail("Danh sách chứa sectionId không hợp lệ.");
  }
  if (new Set(idStrings).size !== idStrings.length) {
    fail("Danh sách chương không được có ID trùng lặp.");
  }
  const existing = await Section.find({ course: course._id }).select("_id").lean();
  const validIds = new Set(existing.map((section) => section._id.toString()));
  if (idStrings.length !== existing.length || idStrings.some((id) => !validIds.has(id))) {
    fail("sectionIds phải chứa đầy đủ các chương thuộc khóa học này, không thừa hoặc thiếu.");
  }
  if (idStrings.length) {
    await Section.bulkWrite(idStrings.map((id, index) => ({
      updateOne: {
        filter: { _id: id, course: course._id },
        update: { $set: { order: index } },
      },
    })));
  }
  return listSections(course);
};
