import mongoose from "mongoose";

const { Schema } = mongoose;

const callSessionSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    initiator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    callType: { type: String, enum: ["audio", "video"], default: "video" },
    provider: {
      type: String,
      enum: ["webrtc", "jitsi", "zoom", "other"],
      required: true,
    },
    externalRoomId: { type: String, trim: true, default: "" },
    joinUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "active", "ended", "missed", "cancelled"],
      default: "ringing",
      index: true,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

callSessionSchema.index({ conversation: 1, createdAt: -1 });

const CallSession =
  mongoose.models.CallSession ||
  mongoose.model("CallSession", callSessionSchema);

export default CallSession;
