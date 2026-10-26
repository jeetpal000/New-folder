// models/Teacher.js

import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    dateOfBirth: {
      type: Date,
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    qualification: [
        {
        type: String,
        trim: true,
      },
  ],

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    joiningDate: {
      type: Date,
    },

    designation: {
      type: String,
      trim: true,
      default: "Teacher",
    },

    subjects: [
      {
        type: String,
        trim: true,
      },
    ],

    classes: [
      {
        type: String,
        trim: true,
      },
    ],

    teachingAssignments: [
      {
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          required: true,
        },
        subjectIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
          },
        ],
      },
    ],

    profileImage: {
      type: String,
      default: "",
    },

    profileImagePublicId: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

teacherSchema.index(
  { schoolId: 1, employeeId: 1 },
  { unique: true }
);

export const Teacher = mongoose.models.Teacher ||  mongoose.model("Teacher", teacherSchema);