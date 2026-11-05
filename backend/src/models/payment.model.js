import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: {
      type: String,
      enum: ["mock", "vnpay", "momo", "stripe", "paypal"],
      default: "mock",
      required: true,
    },
    providerTransactionId: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: "VND" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 2000, default: "" },
    rawResponse: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index(
  { provider: 1, providerTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { providerTransactionId: { $type: "string", $gt: "" } },
  }
);
paymentSchema.index({ order: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
