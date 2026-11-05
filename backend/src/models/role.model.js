import mongoose from "mongoose";

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Ví dụ: "course:create", "user:manage".
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => items.every((item) => item.trim().length > 0),
        message: "Permission không được để trống.",
      },
    },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
