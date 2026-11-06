import path from "node:path";
import { uploadBuffer } from "../libs/cloudinary.js";
import { getResourceType } from "../middlewares/upload.middleware.js";

const handleError = (res, error) => {
  console.error("Upload Controller Error:", error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Không thể upload file lên Cloudinary.",
  });
};

// Multer đọc tên file theo latin1 → chuyển lại UTF-8 cho tên tiếng Việt.
// Chỉ chuyển khi chuỗi toàn ký tự latin1 và kết quả là UTF-8 hợp lệ, để không giải mã hai lần.
const decodeFileName = (name) => {
  if (![...name].every((char) => char.charCodeAt(0) < 256)) return name;
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("�") ? name : decoded;
};

// POST /api/uploads/image — ảnh bìa khóa học.
export const uploadImage = async (req, res) => {
  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: "online-course/images",
      resource_type: "image",
    });
    return res.status(201).json({
      success: true,
      message: "Upload ảnh thành công.",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        sizeBytes: result.bytes,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/uploads/file — tài liệu đính kèm bài học.
// Trả về đúng dạng một phần tử resources[] mà lesson.service.js chấp nhận.
export const uploadResource = async (req, res) => {
  try {
    const originalName = decodeFileName(req.file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, extension).replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80);

    // resource_type "raw" giữ nguyên file (PDF, DOCX, ZIP...) và URL tải về có đuôi file gốc.
    const result = await uploadBuffer(req.file.buffer, {
      folder: "online-course/resources",
      resource_type: "raw",
      public_id: `${baseName || "file"}-${Date.now()}${extension}`,
    });

    return res.status(201).json({
      success: true,
      message: "Upload tài liệu thành công.",
      data: {
        name: originalName.slice(0, 255),
        type: getResourceType(originalName),
        url: result.secure_url,
        sizeBytes: result.bytes,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};
