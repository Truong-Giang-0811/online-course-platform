import mongoose from "mongoose";

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "refunded", "revoked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
