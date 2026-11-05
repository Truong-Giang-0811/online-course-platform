import mongoose from "mongoose";

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, trim: true, maxlength: 255, default: "" },
    mimeType: { type: String, trim: true, maxlength: 120, default: "" },
    sizeBytes: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const readReceiptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, maxlength: 10000, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    messageType: {
      type: String,
      enum: ["text", "file", "system"],
      default: "text",
    },
    readBy: { type: [readReceiptSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
