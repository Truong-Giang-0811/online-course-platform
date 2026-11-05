import mongoose from "mongoose";

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cartWishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    cartItems: { type: [cartItemSchema], default: [] },
    wishlistCourses: {
      type: [{ type: Schema.Types.ObjectId, ref: "Course" }],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

const CartWishlist =
  mongoose.models.CartWishlist ||
  mongoose.model("CartWishlist", cartWishlistSchema);

export default CartWishlist;
