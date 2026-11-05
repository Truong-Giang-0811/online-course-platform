import mongoose from "mongoose";

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Chỉ lưu SHA-256 hash, tuyệt đối không lưu refresh token gốc.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    // Các token được cấp nối tiếp trong cùng một lần đăng nhập có chung familyId.
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    createdByIp: {
      type: String,
      default: "",
      maxlength:  100,
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true, versionKey: false }
);

// MongoDB tự dọn record đã hết hạn; service vẫn tự kiểm tra expiresAt khi sử dụng.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, familyId: 1 });

const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
