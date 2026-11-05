import mongoose from "mongoose";

const { Schema } = mongoose;

const sectionSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    order: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

// Không unique order để hỗ trợ thao tác hoán đổi thứ tự nhiều bản ghi.
sectionSchema.index({ course: 1, order: 1 });

const Section =
  mongoose.models.Section || mongoose.model("Section", sectionSchema);

export default Section;
