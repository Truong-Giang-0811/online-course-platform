import * as categoryService from "../services/category.service.js";

const handleError = (res, error) => {
  console.error("Category Controller Error:", error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Lỗi máy chủ.",
  });
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công.",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const result = await categoryService.getCategories(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách danh mục thành công.",
      data: result.categories,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết danh mục thành công.",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công.",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Xóa danh mục thành công.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/categories/:id/status
export const updateCategoryStatus = async (req, res) => {
  try {
    const category = await categoryService.updateCategoryStatus(
      req.params.id,
      req.body.isActive
    );
    return res.status(200).json({
      success: true,
      message: category.isActive
        ? "Kích hoạt danh mục thành công."
        : "Ngừng hoạt động danh mục thành công.",
      data: category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
