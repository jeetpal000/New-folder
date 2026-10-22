import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Leave"],
      required: true,
    },
  },
  { timestamps: true },
);

attendanceSchema.index(
  { schoolId: 1, classId: 1, studentId: 1, date: 1 },
  { unique: true },
);

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);
