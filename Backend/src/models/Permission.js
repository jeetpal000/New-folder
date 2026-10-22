// models/Permission.js

import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      trim: true,
    },
    module: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Permission =
  mongoose.models.Permission ||
  mongoose.model("Permission", permissionSchema);