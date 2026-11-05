import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    moderationStatus: {
      type: String,
      enum: ["visible", "hidden", "pending"],
      default: "visible",
      index: true,
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    moderationReason: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true, versionKey: false }
);

commentSchema.index({ lesson: 1, createdAt: -1 });

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
