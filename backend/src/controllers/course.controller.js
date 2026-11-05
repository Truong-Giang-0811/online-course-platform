
import * as courseService from "../services/course.service.js";

const handleError = (res, error) => {
  console.error("Course Controller Error:", error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Lỗi máy chủ.",
  });
};

// POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const course = await courseService.createCourse(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/courses
export const getCourses = async (req, res) => {
  try {
    const result = await courseService.getCourses(
      req.query,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách khóa học thành công.",
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết khóa học thành công.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const course = await courseService.updateCourse(
      req.course,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật khóa học thành công.",
      data: course,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const result = await courseService.deleteCourse(
      req.course,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Xóa khóa học thành công.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
