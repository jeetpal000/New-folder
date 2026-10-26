import mongoose from "mongoose";

const teacherPayoutSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    paidAt: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

teacherPayoutSchema.index({ schoolId: 1, teacherId: 1, period: -1 });

export const TeacherPayout =
  mongoose.models.TeacherPayout ||
  mongoose.model("TeacherPayout", teacherPayoutSchema);
