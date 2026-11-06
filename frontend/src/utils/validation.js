const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kiểm tra giống phía backend (auth.controller.js) để báo lỗi sớm.
export const validateRegister = ({ fullName, email, password, confirmPassword }) => {
  const name = fullName.trim();
  if (name.length < 2 || name.length > 120) return "Họ tên phải có từ 2 đến 120 ký tự.";
  if (!EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254) return "Email không hợp lệ.";
  if (password.length < 8 || password.length > 72) return "Mật khẩu phải có từ 8 đến 72 ký tự.";
  if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp.";
  return "";
};

// Giống course.service.js: tiêu đề, mô tả, danh mục bắt buộc; giá >= 0.
export const validateCourse = ({ title, description, category, price }) => {
  if (!title.trim() || !description.trim()) return "Tiêu đề và mô tả khóa học là bắt buộc.";
  if (title.trim().length > 180) return "Tiêu đề không được vượt quá 180 ký tự.";
  if (!category) return "Vui lòng chọn danh mục.";
  const value = Number(price);
  if (price === "" || !Number.isFinite(value) || value < 0) return "Giá khóa học phải là số lớn hơn hoặc bằng 0.";
  return "";
};

export const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Giống lesson.service.js.
export const validateLesson = ({ title, videoUrl, durationSeconds, resources }) => {
  if (!title.trim()) return "Vui lòng nhập tiêu đề bài học.";
  if (title.trim().length > 180) return "Tiêu đề bài học không được vượt quá 180 ký tự.";
  if (videoUrl.trim() && !isHttpUrl(videoUrl.trim())) return "videoUrl phải là URL http/https hợp lệ.";
  const duration = Number(durationSeconds);
  if (!Number.isSafeInteger(duration) || duration < 0) return "Thời lượng phải là số nguyên không âm.";
  for (const [index, r] of resources.entries()) {
    if (!r.name.trim()) return `Tên tài liệu ${index + 1} không được để trống.`;
    if (!isHttpUrl(r.url.trim())) return `URL tài liệu ${index + 1} phải là URL http/https hợp lệ.`;
  }
  return "";
};
