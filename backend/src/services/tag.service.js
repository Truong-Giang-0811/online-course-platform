import mongoose from "mongoose";
import { Course, Tag } from "../models/index.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const generateUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = slugify(name);
  if (!baseSlug) throw createError("Không thể tạo slug từ tên Tag.");

  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    if (!(await Tag.exists(filter))) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

const validateName = async (name, excludeId = null) => {
  if (typeof name !== "string" || !name.trim()) {
    throw createError("Tên Tag là bắt buộc.");
  }

  const normalizedName = name.trim().replace(/\s+/g, " ");
  if (normalizedName.length > 60) {
    throw createError("Tên Tag không được vượt quá 60 ký tự.");
  }

  const filter = {
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Tag.exists(filter)) throw createError("Tên Tag đã tồn tại.", 409);
  return normalizedName;
};

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw createError("isActive phải có giá trị true hoặc false.");
};

const handleDuplicateKey = (error) => {
  if (error?.code === 11000) return createError("Tên hoặc slug Tag đã tồn tại.", 409);
  return error;
};

// CREATE: Admin tạo Tag; slug được sinh tự động từ name.
export const createTag = async (data = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Dữ liệu Tag không hợp lệ.");
  }

  try {
    const name = await validateName(data.name);
    const slug = await generateUniqueSlug(name);
    return await Tag.create({ name, slug, isActive: true });
  } catch (error) {
    throw handleDuplicateKey(error);
  }
};

// LIST: Student/Instructor chỉ thấy Tag đang hoạt động; Admin có thể lọc tất cả.
export const getTags = async (query = {}, user) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const filter = {};

  if (user?.role !== "admin") {
    // $ne:false vẫn nhận các bản ghi Tag cũ chưa có trường isActive.
    filter.isActive = { $ne: false };
  } else if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = parseBoolean(query.isActive);
  }

  if (query.keyword !== undefined && typeof query.keyword !== "string") {
    throw createError("Từ khóa tìm kiếm phải là chuỗi.");
  }
  if (query.keyword?.trim()) {
    const keyword = escapeRegex(query.keyword.trim());
    filter.name = { $regex: keyword, $options: "i" };
  }

  const allowedSortFields = ["name", "createdAt", "updatedAt"];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .sort({ [sortBy]: sortOrder, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Tag.countDocuments(filter),
  ]);

  return {
    tags,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// DETAIL.
export const getTagById = async (tagId, user) => {
  if (!isValidId(tagId)) throw createError("Tag ID không hợp lệ.");
  const filter = { _id: tagId };
  if (user?.role !== "admin") filter.isActive = { $ne: false };
  const tag = await Tag.findOne(filter).lean();
  if (!tag) throw createError("Không tìm thấy Tag.", 404);
  return tag;
};

// UPDATE: Không nhận slug từ client; đổi tên thì tự tạo slug mới.
export const updateTag = async (tagId, data = {}) => {
  if (!isValidId(tagId)) throw createError("Tag ID không hợp lệ.");
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Dữ liệu cập nhật không hợp lệ.");
  }

  const tag = await Tag.findById(tagId);
  if (!tag) throw createError("Không tìm thấy Tag.", 404);
  if (data.name === undefined) throw createError("Vui lòng cung cấp tên Tag cần cập nhật.");

  try {
    const name = await validateName(data.name, tag._id);
    if (name !== tag.name) {
      tag.name = name;
      tag.slug = await generateUniqueSlug(name, tag._id);
    }
    await tag.save();
    return tag;
  } catch (error) {
    throw handleDuplicateKey(error);
  }
};

// DELETE: Không xóa Tag đang được Course tham chiếu.
export const deleteTag = async (tagId) => {
  if (!isValidId(tagId)) throw createError("Tag ID không hợp lệ.");
  const tag = await Tag.findById(tagId).select("_id name");
  if (!tag) throw createError("Không tìm thấy Tag.", 404);

  const hasCourses = await Course.exists({ tags: tag._id });
  if (hasCourses) {
    throw createError(
      "Không thể xóa Tag đang được khóa học sử dụng. Hãy ngừng hoạt động Tag thay vì xóa.",
      409
    );
  }

  await tag.deleteOne();
  return { tagId: tag._id };
};

// ACTIVATE / DEACTIVATE.
export const updateTagStatus = async (tagId, isActive) => {
  if (!isValidId(tagId)) throw createError("Tag ID không hợp lệ.");
  const active = parseBoolean(isActive);
  const tag = await Tag.findByIdAndUpdate(
    tagId,
    { $set: { isActive: active } },
    { new: true, runValidators: true }
  );
  if (!tag) throw createError("Không tìm thấy Tag.", 404);
  return tag;
};
