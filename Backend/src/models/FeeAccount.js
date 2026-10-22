import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Card", "Other"],
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const feeAccountSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    academicSession: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: Date,
    payments: {
      type: [paymentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

feeAccountSchema.index(
  { schoolId: 1, studentId: 1, academicSession: 1 },
  { unique: true },
);

export default mongoose.models.FeeAccount ||
  mongoose.model("FeeAccount", feeAccountSchema);
