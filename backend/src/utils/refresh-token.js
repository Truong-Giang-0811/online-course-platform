import { createHash, randomBytes, randomUUID } from "node:crypto";

export const generateRefreshToken = () =>
  randomBytes(64).toString("base64url");

export const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const generateTokenFamilyId = () => randomUUID();

export const getRefreshTokenExpiry = () => {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("REFRESH_TOKEN_EXPIRES_DAYS phải là số nguyên từ 1 đến 365.");
  }

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
