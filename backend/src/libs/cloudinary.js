import { v2 as cloudinary } from "cloudinary";

let configured = false;

// Cấu hình lười để dotenv.config() trong server.js chạy trước khi đọc biến môi trường.
const getCloudinary = () => {
  if (!configured) {
    const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;
    if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
      throw new Error("Thiếu cấu hình CLOUD_NAME, CLOUD_API_KEY hoặc CLOUD_API_SECRET.");
    }
    cloudinary.config({
      cloud_name: CLOUD_NAME.trim(),
      api_key: CLOUD_API_KEY.trim(),
      api_secret: CLOUD_API_SECRET.trim(),
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
};

// Upload buffer (từ multer memoryStorage) lên Cloudinary.
export const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
