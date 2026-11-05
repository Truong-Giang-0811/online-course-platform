import mongoose from "mongoose";

const { Schema } = mongoose;


// Schema mô tả một tài liệu đính kèm
const resourceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    type: {
      type: String,
      enum: [
        "pdf",
        "doc",
        "docx",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "zip",
        "rar",
        "txt",
        "other",
      ],
      required: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    sizeBytes: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

const lessonSchema = new Schema(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    videoUrl: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, default: "" },
    resources: {type : [resourceSchema], default : [] },
    durationSeconds: { type: Number, min: 0, default: 0 },
    order: { type: Number, required: true, min: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

lessonSchema.index({ section: 1, order: 1 });
lessonSchema.index({ course: 1, createdAt: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);

export default Lesson;
