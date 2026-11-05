import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order",
        "payment",
        "new_lesson",
        "message",
        "instructor_review",
        "system",
        "course_review",
        "call",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    body: { type: String, trim: true, maxlength: 2000, default: "" },
    data: { type: Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: "date" } } }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
