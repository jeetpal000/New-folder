import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    marks: {
      type: Number,
      min: 0,
      default: null,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    remark: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: false },
);

const assessmentSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["Quiz", "Unit Test", "Mid Term", "Final", "Other"],
      required: true,
    },
    academicSession: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 0.01,
    },
    passMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
      index: true,
    },
    results: {
      type: [resultSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: Date,
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

assessmentSchema.index({
  schoolId: 1,
  classId: 1,
  academicSession: 1,
  scheduledAt: -1,
});

export default mongoose.models.Assessment ||
  mongoose.model("Assessment", assessmentSchema);
