import * as sectionService from "../services/section.service.js";

const handleError = (res, error) => {
  console.error("Section Controller Error:", error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Lỗi máy chủ.",
  });
};

export const listSections = async (req, res) => {
  try {
    const sections = await sectionService.listSections(req.course);
    return res.status(200).json({ success: true, message: "Lấy danh sách chương thành công.", data: sections });
  } catch (error) { return handleError(res, error); }
};

export const createSection = async (req, res) => {
  try {
    const section = await sectionService.createSection(req.course, req.body, req.user);
    return res.status(201).json({ success: true, message: "Tạo chương thành công.", data: section });
  } catch (error) { return handleError(res, error); }
};

export const updateSection = async (req, res) => {
  try {
    const section = await sectionService.updateSection(req.course, req.params.sectionId, req.body, req.user);
    return res.status(200).json({ success: true, message: "Cập nhật chương thành công.", data: section });
  } catch (error) { return handleError(res, error); }
};

export const deleteSection = async (req, res) => {
  try {
    const result = await sectionService.deleteSection(req.course, req.params.sectionId, req.user);
    return res.status(200).json({ success: true, message: "Xóa chương thành công.", data: result });
  } catch (error) { return handleError(res, error); }
};

export const reorderSections = async (req, res) => {
  try {
    const sections = await sectionService.reorderSections(req.course, req.body, req.user);
    return res.status(200).json({ success: true, message: "Sắp xếp chương thành công.", data: sections });
  } catch (error) { return handleError(res, error); }
};
