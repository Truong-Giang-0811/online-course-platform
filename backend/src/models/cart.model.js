import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const CartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = models.Cart || model("Cart", CartSchema);

export default Cart;