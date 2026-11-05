import mongoose from "mongoose";
import { Category, Course } from "../models/index.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

// Chuyển tên danh mục tiếng Việt thành slug thân thiện với URL.
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

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = slugify(name);
  if (!baseSlug) {
    throw createError("Không thể tạo slug từ tên danh mục.");
  }

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };

    if (!(await Category.exists(filter))) return slug;

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

const validateName = async (name, excludeId = null) => {
  if (typeof name !== "string" || !name.trim()) {
    throw createError("Tên danh mục là bắt buộc.");
  }

  const normalizedName = name.trim();
  if (normalizedName.length > 100) {
    throw createError("Tên danh mục không được vượt quá 100 ký tự.");
  }

  const filter = {
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
  };
  if (excludeId) filter._id = { $ne: excludeId };

  if (await Category.exists(filter)) {
    throw createError("Tên danh mục đã tồn tại.", 409);
  }

  return normalizedName;
};

const parseBoolean = (value, fieldName = "isActive") => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw createError(`${fieldName} phải có giá trị true hoặc false.`);
};

const handleDuplicateKey = (error) => {
  if (error?.code === 11000) {
    return createError("Tên hoặc slug danh mục đã tồn tại.", 409);
  }
  return error;
};

// 1. CREATE CATEGORY - chỉ Admin được gọi qua Router.
export const createCategory = async (data = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Dữ liệu danh mục không hợp lệ.");
  }

  try {
    const name = await validateName(data.name);
    const description = data.description ?? "";

    if (typeof description !== "string") {
      throw createError("Mô tả danh mục phải là chuỗi.");
    }
    if (description.trim().length > 1000) {
      throw createError("Mô tả không được vượt quá 1000 ký tự.");
    }

    const slug = await generateUniqueSlug(name);
    return await Category.create({
      name,
      slug,
      description: description.trim(),
      isActive: true,
    });
  } catch (error) {
    throw handleDuplicateKey(error);
  }
};

// 2. GET CATEGORIES - người dùng thường chỉ nhìn thấy danh mục đang hoạt động.
export const getCategories = async (query, user) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const filter = {};

  if (user.role !== "admin") {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = parseBoolean(query.isActive);
  }

  if (query.keyword !== undefined && typeof query.keyword !== "string") {
    throw createError("Từ khóa tìm kiếm phải là chuỗi.");
  }

  if (query.keyword?.trim()) {
    const keyword = escapeRegex(query.keyword.trim());
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  const allowedSortFields = ["name", "createdAt", "updatedAt"];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ [sortBy]: sortOrder, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 3. GET CATEGORY DETAIL.
export const getCategoryById = async (categoryId, user) => {
  if (!isValidId(categoryId)) {
    throw createError("Category ID không hợp lệ.");
  }

  const filter = { _id: categoryId };
  if (user.role !== "admin") filter.isActive = true;

  const category = await Category.findOne(filter).lean();
  if (!category) throw createError("Không tìm thấy danh mục.", 404);

  return category;
};

// 4. UPDATE CATEGORY - không nhận slug trực tiếp; slug được sinh từ name.
export const updateCategory = async (categoryId, data = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Dữ liệu cập nhật không hợp lệ.");
  }
  if (!isValidId(categoryId)) {
    throw createError("Category ID không hợp lệ.");
  }

  const category = await Category.findById(categoryId);
  if (!category) throw createError("Không tìm thấy danh mục.", 404);

  const allowedFields = ["name", "description"];
  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  if (Object.keys(updates).length === 0) {
    throw createError("Vui lòng cung cấp ít nhất một trường cần cập nhật.");
  }

  if (updates.name !== undefined) {
    updates.name = await validateName(updates.name, category._id);
    if (updates.name !== category.name) {
      updates.slug = await generateUniqueSlug(updates.name, category._id);
    }
  }

  if (updates.description !== undefined) {
    if (typeof updates.description !== "string") {
      throw createError("Mô tả danh mục phải là chuỗi.");
    }
    updates.description = updates.description.trim();
    if (updates.description.length > 1000) {
      throw createError("Mô tả không được vượt quá 1000 ký tự.");
    }
  }

  try {
    Object.assign(category, updates);
    await category.save();
    return category;
  } catch (error) {
    throw handleDuplicateKey(error);
  }
};

// 5. DELETE CATEGORY - không xóa nếu vẫn có khóa học tham chiếu.
export const deleteCategory = async (categoryId) => {
  if (!isValidId(categoryId)) {
    throw createError("Category ID không hợp lệ.");
  }

  const category = await Category.findById(categoryId).select("_id name");
  if (!category) throw createError("Không tìm thấy danh mục.", 404);

  const hasCourses = await Course.exists({ category: category._id });
  if (hasCourses) {
    throw createError(
      "Không thể xóa danh mục đang được khóa học sử dụng. Hãy ngừng hoạt động danh mục thay vì xóa.",
      409
    );
  }

  await category.deleteOne();
  return { categoryId: category._id };
};

// 6. ACTIVATE / DEACTIVATE CATEGORY.
export const updateCategoryStatus = async (categoryId, isActive) => {
  if (!isValidId(categoryId)) {
    throw createError("Category ID không hợp lệ.");
  }

  const active = parseBoolean(isActive);
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { $set: { isActive: active } },
    { new: true, runValidators: true }
  );

  if (!category) throw createError("Không tìm thấy danh mục.", 404);
  return category;
};
