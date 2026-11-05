import mongoose from "mongoose";

const { Schema } = mongoose;

const lessonProgressSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    lastPositionSeconds: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ student: 1, course: 1 });

const LessonProgress =
  mongoose.models.LessonProgress ||
  mongoose.model("LessonProgress", lessonProgressSchema);

export default LessonProgress;
