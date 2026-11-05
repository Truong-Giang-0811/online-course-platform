import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, trim: true, maxlength: 5000, default: "" },
    status: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true });
reviewSchema.index({ course: 1, status: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
