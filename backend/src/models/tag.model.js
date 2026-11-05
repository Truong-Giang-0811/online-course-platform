import mongoose from "mongoose";

const { Schema } = mongoose;

const tagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true, versionKey: false }
);

const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);

export default Tag;
