export const ROLE_LABELS = { student: "Học viên", instructor: "Giảng viên", admin: "Quản trị viên" };

export const COURSE_STATUS_LABELS = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
};

export const RESOURCE_TYPES = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar", "txt", "other"];

// Khớp với upload.middleware.js của backend.
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const RESOURCE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt";
export const MAX_IMAGE_MB = 5;
export const MAX_FILE_MB = 20;

export const formatBytes = (bytes = 0) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

export const formatPrice = (price) =>
  Number(price) === 0 ? "Miễn phí" : `${Number(price).toLocaleString("vi-VN")} ₫`;

export const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
