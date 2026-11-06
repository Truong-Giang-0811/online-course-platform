import * as tagService from "../services/tag.service.js";

const handleError = (res, error) => {
  console.error("Tag Controller Error:", error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Lỗi máy chủ.",
  });
};

export const createTag = async (req, res) => {
  try {
    const tag = await tagService.createTag(req.body);
    return res.status(201).json({ success: true, message: "Tạo Tag thành công.", data: tag });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTags = async (req, res) => {
  try {
    const result = await tagService.getTags(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách Tag thành công.",
      data: result.tags,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTagById = async (req, res) => {
  try {
    const tag = await tagService.getTagById(req.params.id, req.user);
    return res.status(200).json({ success: true, message: "Lấy chi tiết Tag thành công.", data: tag });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTag = async (req, res) => {
  try {
    const tag = await tagService.updateTag(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Cập nhật Tag thành công.", data: tag });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteTag = async (req, res) => {
  try {
    const result = await tagService.deleteTag(req.params.id);
    return res.status(200).json({ success: true, message: "Xóa Tag thành công.", data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTagStatus = async (req, res) => {
  try {
    const tag = await tagService.updateTagStatus(req.params.id, req.body.isActive);
    return res.status(200).json({
      success: true,
      message: tag.isActive ? "Kích hoạt Tag thành công." : "Ngừng hoạt động Tag thành công.",
      data: tag,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
