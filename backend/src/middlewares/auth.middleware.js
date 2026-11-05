import User from "../models/user.model.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập hoặc thiếu access token.",
      });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token không hợp lệ.",
      });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub)
      .select("_id role status")
      .lean();

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa.",
      });
    }

    // Lấy role hiện tại từ DB để thay đổi phân quyền có hiệu lực ngay.
    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Access token không hợp lệ hoặc đã hết hạn.",
    });
  }
};
