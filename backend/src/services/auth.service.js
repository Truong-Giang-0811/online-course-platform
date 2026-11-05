
import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  generateTokenFamilyId,
  getRefreshTokenExpiry,
} from "../utils/refresh-token.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toPublicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const issueTokenPair = async (user, metadata = {}, familyId = generateTokenFamilyId()) => {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    familyId,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: metadata.ip || "",
    userAgent: metadata.userAgent || "",
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
  };
};

const revokeTokenFamily = async (familyId, revokedAt = new Date()) => {
  await RefreshToken.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt } }
  );
};

export const register = async ({ fullName, email, password }, metadata = {}) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    throw createHttpError("Email đã được sử dụng.", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    // Không nhận role từ request đăng ký công khai.
    role: "student",
  });

  const tokens = await issueTokenPair(user, metadata);
  return { user: toPublicUser(user), ...tokens };
};

export const login = async ({ email, password }, metadata = {}) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    throw createHttpError("Email hoặc mật khẩu không chính xác.", 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createHttpError("Email hoặc mật khẩu không chính xác.", 401);
  }

  if (user.status !== "active") {
    throw createHttpError("Tài khoản đã bị khóa.", 403);
  }

  const tokens = await issueTokenPair(user, metadata);
  return { user: toPublicUser(user), ...tokens };
};

/**
 * Xoay vòng Refresh Token:
 * 1. Tìm token bằng hash.
 * 2. Từ chối token không tồn tại/hết hạn.
 * 3. Nếu token đã bị thu hồi nhưng bị dùng lại, thu hồi toàn bộ family.
 * 4. Thu hồi token cũ bằng cập nhật có điều kiện (atomic).
 * 5. Cấp token mới trong cùng family.
 */
export const refresh = async (rawRefreshToken, metadata = {}) => {
  if (typeof rawRefreshToken !== "string" || rawRefreshToken.length < 40) {
    throw createHttpError("Refresh token không hợp lệ.", 401);
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash }).select("+tokenHash");

  if (!storedToken) {
    throw createHttpError("Refresh token không hợp lệ hoặc đã hết hạn.", 401);
  }

  const now = new Date();

  if (storedToken.revokedAt) {
    // Token đã xoay vòng/đăng xuất nhưng bị sử dụng lại: thu hồi cả phiên.
    await revokeTokenFamily(storedToken.familyId, now);
    throw createHttpError("Refresh token đã được sử dụng hoặc bị thu hồi. Vui lòng đăng nhập lại.", 401);
  }

  if (storedToken.expiresAt <= now) {
    storedToken.revokedAt = now;
    await storedToken.save();
    throw createHttpError("Refresh token đã hết hạn. Vui lòng đăng nhập lại.", 401);
  }

  const user = await User.findById(storedToken.userId).select(
    "_id fullName email avatarUrl role status createdAt"
  );

  if (!user || user.status !== "active") {
    await revokeTokenFamily(storedToken.familyId, now);
    throw createHttpError("Tài khoản không tồn tại hoặc đã bị khóa.", 401);
  }

  // Chỉ một request đồng thời có thể thu hồi thành công token cũ.
  const consumedToken = await RefreshToken.findOneAndUpdate(
    {
      _id: storedToken._id,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { revokedAt: now } },
    { new: true }
  );

  if (!consumedToken) {
    const latestToken = await RefreshToken.findById(storedToken._id).select("familyId revokedAt");
    if (latestToken?.revokedAt) {
      await revokeTokenFamily(storedToken.familyId, now);
    }
    throw createHttpError("Refresh token không còn hiệu lực. Vui lòng đăng nhập lại.", 401);
  }

  try {
    const nextRefreshToken = generateRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: nextTokenHash,
      familyId: storedToken.familyId,
      expiresAt: getRefreshTokenExpiry(),
      createdByIp: metadata.ip || "",
      userAgent: metadata.userAgent || "",
    });

    await RefreshToken.updateOne(
      { _id: storedToken._id },
      { $set: { replacedByTokenHash: nextTokenHash } }
    );

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken(user),
      refreshToken: nextRefreshToken,
    };
  } catch (error) {
    // Token cũ đã bị tiêu thụ; không khôi phục token cũ nếu cấp token mới thất bại.
    throw error;
  }
};

export const logout = async (rawRefreshToken) => {
  if (typeof rawRefreshToken !== "string" || !rawRefreshToken) {
    // Logout có tính idempotent: không có token cũng xem như đã đăng xuất.
    return;
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const logoutAll = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select(
    "_id fullName email avatarUrl role status createdAt updatedAt"
  );

  if (!user || user.status !== "active") {
    throw createHttpError("Tài khoản không tồn tại hoặc đã bị khóa.", 401);
  }

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
