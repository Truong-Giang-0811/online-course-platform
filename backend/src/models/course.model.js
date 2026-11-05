import mongoose from "mongoose";

const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    coverImageUrl: { type: String, trim: true, default: "" },

    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],

    price: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 2000, default: "" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

courseSchema.index({ title: "text", description: "text" });
courseSchema.index({ category: 1, status: 1, createdAt: -1 });
courseSchema.index({ instructor: 1, status: 1, updatedAt: -1 });

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
