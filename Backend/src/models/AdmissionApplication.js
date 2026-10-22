import mongoose from "mongoose";

const admissionApplicationSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
    },
    guardianPhone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    requestedClass: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewing", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

admissionApplicationSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export default mongoose.models.AdmissionApplication ||
  mongoose.model("AdmissionApplication", admissionApplicationSchema);
