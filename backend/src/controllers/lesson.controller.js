import * as lessonService from "../services/lesson.service.js";

const handleError = (res, error) => {
  console.error("Lesson Controller Error:", error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Lỗi máy chủ khi xử lý bài học.",
  });
};

export const listLessons = async (req, res) => {
  try {
    const data = await lessonService.listLessons(req.course, req.params.sectionId);
    return res.status(200).json({ success: true, message: "Lấy danh sách bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};

export const getLessonById = async (req, res) => {
  try {
    const data = await lessonService.getLessonById(req.course, req.params.sectionId, req.params.lessonId);
    return res.status(200).json({ success: true, message: "Lấy chi tiết bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};

export const createLesson = async (req, res) => {
  try {
    const data = await lessonService.createLesson(req.course, req.params.sectionId, req.body, req.user);
    return res.status(201).json({ success: true, message: "Tạo bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};

export const updateLesson = async (req, res) => {
  try {
    const data = await lessonService.updateLesson(req.course, req.params.sectionId, req.params.lessonId, req.body, req.user);
    return res.status(200).json({ success: true, message: "Cập nhật bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};

export const deleteLesson = async (req, res) => {
  try {
    const data = await lessonService.deleteLesson(req.course, req.params.sectionId, req.params.lessonId, req.user);
    return res.status(200).json({ success: true, message: "Xóa bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};

export const reorderLessons = async (req, res) => {
  try {
    const data = await lessonService.reorderLessons(req.course, req.params.sectionId, req.body, req.user);
    return res.status(200).json({ success: true, message: "Sắp xếp bài học thành công.", data });
  } catch (error) { return handleError(res, error); }
};
