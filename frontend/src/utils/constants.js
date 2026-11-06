export const ROLE_LABELS = { student: "Học viên", instructor: "Giảng viên", admin: "Quản trị viên" };

export const COURSE_STATUS_LABELS = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
};

export const RESOURCE_TYPES = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar", "txt", "other"];

export const formatPrice = (price) =>
  Number(price) === 0 ? "Miễn phí" : `${Number(price).toLocaleString("vi-VN")} ₫`;

export const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
