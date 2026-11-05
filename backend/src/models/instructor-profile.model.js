import mongoose from "mongoose";

const { Schema } = mongoose;

const instructorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    expertise: {
      type: [String],
      default: [],
      set: (items) => items.map((item) => item.trim()).filter(Boolean),
    },
    experienceYears: { type: Number, min: 0, default: 0 },
    biography: { type: String, trim: true, maxlength: 5000, default: "" },
    portfolioUrl: { type: String, trim: true, default: "" },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    applicationNote: { type: String, trim: true, maxlength: 2000, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

const InstructorProfile =
  mongoose.models.InstructorProfile ||
  mongoose.model("InstructorProfile", instructorProfileSchema);

export default InstructorProfile;
