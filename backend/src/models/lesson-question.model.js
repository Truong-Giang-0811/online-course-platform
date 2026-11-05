import mongoose from "mongoose";

const { Schema } = mongoose;

const officialAnswerSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lessonQuestionSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    officialAnswer: { type: officialAnswerSchema, default: null },
    status: {
      type: String,
      enum: ["open", "answered", "closed", "hidden"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

lessonQuestionSchema.index({ lesson: 1, createdAt: -1 });

const LessonQuestion =
  mongoose.models.LessonQuestion ||
  mongoose.model("LessonQuestion", lessonQuestionSchema);

export default LessonQuestion;
