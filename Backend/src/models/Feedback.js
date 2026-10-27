import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "General feedback",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ["New", "Reviewed", "Resolved"],
      default: "New",
      index: true,
    },
    source: {
      type: String,
      default: "website",
    },
  },
  { timestamps: true },
);

feedbackSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema);
