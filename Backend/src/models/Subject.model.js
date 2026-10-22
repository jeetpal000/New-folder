import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School"
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  classIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ]
  },
);
subjectSchema.index({ schoolId: 1, name: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, classIds: 1 });

export const Subject = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);