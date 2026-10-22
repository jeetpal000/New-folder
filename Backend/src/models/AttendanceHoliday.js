import mongoose from "mongoose";

const attendanceHolidaySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

attendanceHolidaySchema.index(
  { schoolId: 1, classId: 1, date: 1 },
  { unique: true },
);

export default mongoose.models.AttendanceHoliday ||
  mongoose.model("AttendanceHoliday", attendanceHolidaySchema);
