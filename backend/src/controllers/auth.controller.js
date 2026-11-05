import * as authService from "../services/auth.service.js";

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error("[Auth]", error);

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Đã xảy ra lỗi máy chủ." : error.message,
  });
};

const getRequestMetadata = (req) => ({
  ip: req.ip,
  userAgent: req.get("user-agent") || "",
});

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (typeof fullName !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp họ tên, email và mật khẩu hợp lệ." });
    }
    if (fullName.trim().length < 2 || fullName.trim().length > 120) {
      return res.status(400).json({ success: false, message: "Họ tên phải có từ 2 đến 120 ký tự." });
    }

    const normalizedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có từ 8 đến 72 ký tự." });
    }

    const result = await authService.register(
      { fullName, email: normalizedEmail, password },
      getRequestMetadata(req)
    );

    return res.status(201).json({ success: true, message: "Đăng ký tài khoản thành công.", data: result });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = "Email đã được sử dụng.";
    }
    return sendError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp email và mật khẩu." });
    }

    const result = await authService.login({ email, password }, getRequestMetadata(req));
    return res.status(200).json({ success: true, message: "Đăng nhập thành công.", data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (typeof refreshToken !== "string" || !refreshToken) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp refreshToken." });
    }

    const result = await authService.refresh(refreshToken, getRequestMetadata(req));
    return res.status(200).json({ success: true, message: "Làm mới token thành công.", data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return res.status(200).json({ success: true, message: "Đăng xuất thành công." });
  } catch (error) {
    return sendError(res, error);
  }
};

export const logoutAll = async (req, res) => {
  try {
    await authService.logoutAll(req.user.id);
    return res.status(200).json({ success: true, message: "Đã đăng xuất khỏi tất cả phiên." });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return sendError(res, error);
  }
};
