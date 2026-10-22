// models/Class.js

import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    course: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },

    classTeacherId: 
      [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
  }],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index(
  {
    schoolId: 1,
    name: 1,
    section: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.Class ||
  mongoose.model("Class", classSchema);