import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (items) => items.length >= 2,
        message: "Cuộc trò chuyện phải có ít nhất hai thành viên.",
      },
    },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, trim: true, maxlength: 300, default: "" },
    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

export default Conversation;
