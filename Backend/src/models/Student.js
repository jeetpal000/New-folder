import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    photo: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

studentSchema.index(
  { schoolId: 1, admissionNumber: 1 },
  { unique: true, sparse: true },
);
studentSchema.index({ schoolId: 1, classId: 1, isActive: 1, name: 1 });

export default mongoose.models.Student ||
  mongoose.model("Student", studentSchema);
