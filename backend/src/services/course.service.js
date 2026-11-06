
import mongoose from "mongoose";
import {
  Course,
  User,
  InstructorProfile,
  Category,
  Tag,
  Section,
  Lesson,
  Enrollment,
  CartWishlist,
} from "../models/index.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

// Chuyển tiêu đề thành slug.
const slugify = (value) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Tạo slug không trùng lặp.
const generateUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = slugify(title);

  if (!baseSlug) {
    throw createError("Không thể tạo slug từ tiêu đề khóa học.");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const exists = await Course.exists(filter);

    if (!exists) return slug;

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

// Kiểm tra Category.
const validateCategory = async (categoryId) => {
  if (!isValidId(categoryId)) {
    throw createError("Category ID không hợp lệ.");
  }

  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  }).select("_id");

  if (!category) {
    throw createError("Danh mục không tồn tại hoặc đã bị vô hiệu hóa.", 404);
  }

  return category._id;
};

// Kiểm tra danh sách Tag.
const validateTags = async (tagIds = []) => {
  if (!Array.isArray(tagIds)) {
    throw createError("Tags phải là một mảng.");
  }

  const uniqueIds = [...new Set(tagIds.map(String))];

  if (uniqueIds.some((id) => !isValidId(id))) {
    throw createError("Có Tag ID không hợp lệ.");
  }

  if (uniqueIds.length === 0) return [];

  const tags = await Tag.find({
    _id: { $in: uniqueIds },
    // Không cho gắn Tag đã ngừng hoạt động; vẫn chấp nhận document cũ chưa có isActive.
    isActive: { $ne: false },
  }).select("_id");

  if (tags.length !== uniqueIds.length) {
    throw createError("Một hoặc nhiều Tag không tồn tại.");
  }

  return tags.map((tag) => tag._id);
};

// Kiểm tra Instructor có tài khoản hoạt động và hồ sơ giảng viên đã được duyệt.
const validateInstructor = async (instructorId) => {
  if (!isValidId(instructorId)) {
    throw createError("Instructor ID không hợp lệ.");
  }

  const instructor = await User.findOne({
    _id: instructorId,
    role: "instructor",
    status: "active",
  }).select("_id");

  if (!instructor) {
    throw createError("Instructor không tồn tại hoặc không hoạt động.", 404);
  }

  const profile = await InstructorProfile.findOne({
    user: instructorId,
    applicationStatus: "approved",
  }).select("_id");

  if (!profile) {
    throw createError("Instructor chưa được Admin phê duyệt.", 403);
  }

  return instructor._id;
};

// Kiểm tra và chuẩn hóa giá.
const validatePrice = (price) => {
  const value = Number(price);

  if (!Number.isFinite(value) || value < 0) {
    throw createError("Giá khóa học phải là số lớn hơn hoặc bằng 0.");
  }

  return value;
};

// 1. CREATE COURSE
export const createCourse = async (data, user) => {
  let instructorId;

  if (user.role === "instructor") {
    // Instructor chỉ được tạo khóa học cho chính mình.
    instructorId = await validateInstructor(user.id);
  } else if (user.role === "admin") {
    // Admin phải chỉ định Instructor phụ trách khóa học.
    if (!data.instructor) {
      throw createError("Vui lòng cung cấp Instructor ID.");
    }

    instructorId = await validateInstructor(data.instructor);
  } else {
    throw createError("Bạn không có quyền tạo khóa học.", 403);
  }

  const title = data.title?.trim();
  const description = data.description?.trim();

  if (!title || !description) {
    throw createError("Tiêu đề và mô tả khóa học là bắt buộc.");
  }

  const categoryId = await validateCategory(data.category);
  const tagIds = await validateTags(data.tags || []);
  const price = validatePrice(data.price ?? 0);
  const slug = await generateUniqueSlug(title);

  const course = await Course.create({
    title,
    slug,
    description,
    coverImageUrl: data.coverImageUrl?.trim() || "",
    instructor: instructorId,
    category: categoryId,
    tags: tagIds,
    price,
    // status mặc định là draft theo Course Model.
  });

  return course;
};

// 2. GET COURSES
export const getCourses = async (query, user) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(query.limit, 10) || 10)
  );

  const filter = {};

  // Admin xem được tất cả khóa học.
  if (user.role === "admin") {
    if (query.status) {
      filter.status = query.status;
    }
  }

  // Instructor chỉ xem khóa học của mình.
  else if (user.role === "instructor") {
    filter.instructor = user.id;

    if (query.status) {
      filter.status = query.status;
    }
  }

  // Student chỉ xem khóa học đã xuất bản.
  else if (user.role === "student") {
    filter.status = "published";
  }

  // Lọc theo trạng thái hợp lệ.
  if (
    query.status &&
    !["draft", "published"].includes(query.status)
  ) {
    throw createError("Trạng thái khóa học không hợp lệ.");
  }

  // Lọc theo Category.
  if (query.category) {
    if (!isValidId(query.category)) {
      throw createError("Category ID không hợp lệ.");
    }

    filter.category = query.category;
  }

  // Lọc theo Tag.
  if (query.tag) {
    if (!isValidId(query.tag)) {
      throw createError("Tag ID không hợp lệ.");
    }

    filter.tags = query.tag;
  }

  // Tìm kiếm theo tiêu đề và mô tả.
  if (query.keyword?.trim()) {
    const escapedKeyword = query.keyword
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { title: { $regex: escapedKeyword, $options: "i" } },
      { description: { $regex: escapedKeyword, $options: "i" } },
    ];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "fullName avatarUrl")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Course.countDocuments(filter),
  ]);

  return {
    courses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 3. GET COURSE DETAIL
export const getCourseById = async (courseId, user) => {
  if (!isValidId(courseId)) {
    throw createError("Course ID không hợp lệ.");
  }

  const course = await Course.findById(courseId)
    .populate("instructor", "fullName avatarUrl")
    .populate("category", "name slug description")
    .populate("tags", "name slug");

  if (!course) {
    throw createError("Không tìm thấy khóa học.", 404);
  }

  const isAdmin = user.role === "admin";

  const isOwner =
    user.role === "instructor" &&
    course.instructor._id.toString() === user.id;

  // Student chỉ được xem khóa học đã xuất bản.
  // Instructor được xem khóa học của mình hoặc khóa học đã xuất bản.
  if (!isAdmin && !isOwner && course.status !== "published") {
    throw createError("Không tìm thấy khóa học.", 404);
  }

  return course;
};

// 4. GET MY COURSES
// Danh sách khóa học do giảng viên hiện tại sở hữu, gồm cả draft và published.
export const getMyCourses = async (query, user) => {
  if (user.role !== "instructor") {
    throw createError("Chức năng này chỉ dành cho giảng viên.", 403);
  }

  return getCourses({ ...query, status: query.status }, user);
};

// 5. PUBLISH COURSE
// Xuất bản trực tiếp, không có trạng thái chờ Admin duyệt.
export const publishCourse = async (course, user) => {
  if (course.status === "published") {
    throw createError("Khóa học đã được xuất bản.", 409);
  }

  if (user.role !== "admin" && course.instructor.toString() !== user.id) {
    throw createError("Bạn không có quyền xuất bản khóa học này.", 403);
  }

  // Xác thực lại tài khoản và hồ sơ giảng viên tại thời điểm xuất bản.
  await validateInstructor(course.instructor);

  if (!course.title?.trim() || !course.description?.trim()) {
    throw createError("Khóa học cần có tiêu đề và mô tả.");
  }
  if (!course.category) {
    throw createError("Vui lòng chọn danh mục cho khóa học.");
  }
  await validateCategory(course.category);
  validatePrice(course.price);

  const sections = await Section.find({ course: course._id }).select("_id").lean();
  if (sections.length === 0) {
    throw createError("Cần tạo ít nhất một chương trước khi xuất bản.");
  }

  const lessonCount = await Lesson.countDocuments({ course: course._id });
  if (lessonCount === 0) {
    throw createError("Cần tạo ít nhất một bài học trước khi xuất bản.");
  }

  course.status = "published";
  course.publishedAt = new Date();
  await course.save();
  return course;
};

// 6. UNPUBLISH COURSE
export const unpublishCourse = async (course, user) => {
  if (course.status !== "published") {
    throw createError("Khóa học hiện không ở trạng thái đã xuất bản.", 409);
  }

  if (user.role !== "admin" && course.instructor.toString() !== user.id) {
    throw createError("Bạn không có quyền gỡ xuất bản khóa học này.", 403);
  }

  course.status = "draft";
  course.publishedAt = null;
  await course.save();
  return course;
};

// 7. UPDATE COURSE
// course được lấy từ req.course bởi requireCourseOwner.
export const updateCourse = async (course, data, user) => {
  const isAdmin = user.role === "admin";

  // Khóa học đã công khai phải được gỡ xuất bản trước khi chỉnh sửa nội dung.
  if (!isAdmin && course.status !== "draft") {
    throw createError("Vui lòng gỡ xuất bản khóa học trước khi chỉnh sửa.", 403);
  }

  const allowedFields = [
    "title",
    "description",
    "coverImageUrl",
    "category",
    "tags",
    "price",
  ];

  const updates = {};

  // Chỉ nhận các trường được phép cập nhật.
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || !updates.title.trim()) {
      throw createError("Tiêu đề không được để trống.");
    }

    updates.title = updates.title.trim();

    updates.slug = await generateUniqueSlug(
      updates.title,
      course._id
    );
  }

  if (updates.description !== undefined) {
    if (
      typeof updates.description !== "string" ||
      !updates.description.trim()
    ) {
      throw createError("Mô tả không được để trống.");
    }

    updates.description = updates.description.trim();
  }

  if (updates.coverImageUrl !== undefined) {
    if (typeof updates.coverImageUrl !== "string") {
      throw createError("coverImageUrl phải là chuỗi.");
    }

    updates.coverImageUrl = updates.coverImageUrl.trim();
  }

  if (updates.category !== undefined) {
    updates.category = await validateCategory(updates.category);
  }

  if (updates.tags !== undefined) {
    updates.tags = await validateTags(updates.tags);
  }

  if (updates.price !== undefined) {
    updates.price = validatePrice(updates.price);
  }

  Object.assign(course, updates);

  await course.save();

  return course;
};

// 8. DELETE COURSE
// course được lấy từ req.course bởi requireCourseOwner.
export const deleteCourse = async (course, user) => {
  const isAdmin = user.role === "admin";

  // Instructor chỉ được xóa khóa học nháp.
  if (!isAdmin && course.status !== "draft") {
    throw createError("Chỉ được xóa khóa học ở trạng thái draft.", 403);
  }

  // Không xóa khóa học đã có học viên đăng ký.
  const hasEnrollment = await Enrollment.exists({
    course: course._id,
  });

  if (hasEnrollment) {
    throw createError(
      "Không thể xóa khóa học đã có học viên đăng ký.",
      409
    );
  }

  // Xóa dữ liệu bài học và chương thuộc khóa học.
  await Lesson.deleteMany({ course: course._id });
  await Section.deleteMany({ course: course._id });

  // Xóa khóa học khỏi giỏ hàng và danh sách yêu thích.
  await CartWishlist.updateMany(
    {},
    {
      $pull: {
        cartItems: { course: course._id },
        wishlistCourses: course._id,
      },
    }
  );

  await course.deleteOne();

  return {
    courseId: course._id,
  };
};
