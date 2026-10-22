import mongoose from "mongoose";

const attendanceMonthSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    lockedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

attendanceMonthSchema.index(
  { schoolId: 1, classId: 1, month: 1 },
  { unique: true },
);

export default mongoose.models.AttendanceMonth ||
  mongoose.model("AttendanceMonth", attendanceMonthSchema);
