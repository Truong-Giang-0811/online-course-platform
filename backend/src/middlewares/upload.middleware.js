import multer from "multer";
import path from "node:path";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Đuôi file tài liệu được phép, ánh xạ sang enum "type" của resourceSchema (lesson.model.js).
export const RESOURCE_EXTENSIONS = {
  ".pdf": "pdf",
  ".doc": "doc",
  ".docx": "docx",
  ".ppt": "ppt",
  ".pptx": "pptx",
  ".xls": "xls",
  ".xlsx": "xlsx",
  ".zip": "zip",
  ".rar": "rar",
  ".txt": "txt",
};

export const getResourceType = (fileName) =>
  RESOURCE_EXTENSIONS[path.extname(fileName || "").toLowerCase()] || null;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const imageFileFilter = (req, file, cb) => {
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(createError("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF."));
  }
  return cb(null, true);
};

export const resourceFileFilter = (req, file, cb) => {
  if (!getResourceType(file.originalname)) {
    return cb(createError(`Chỉ chấp nhận file: ${Object.keys(RESOURCE_EXTENSIONS).join(", ")}.`));
  }
  return cb(null, true);
};

const createUploader = (fileFilter, fileSize) =>
  multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize, files: 1 } }).single("file");

// Bọc multer để trả lỗi JSON giống các API khác thay vì lỗi mặc định của Express.
const handleMulter = (uploader, maxSize) => (req, res, next) =>
  uploader(req, res, (error) => {
    if (!error) {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Vui lòng chọn file với field \"file\"." });
      }
      return next();
    }
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File vượt quá dung lượng cho phép (${maxSize / 1024 / 1024}MB).`,
      });
    }
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  });

export const uploadImage = handleMulter(createUploader(imageFileFilter, MAX_IMAGE_SIZE), MAX_IMAGE_SIZE);
export const uploadResource = handleMulter(createUploader(resourceFileFilter, MAX_FILE_SIZE), MAX_FILE_SIZE);
