// models/UserPermission.js

import mongoose from "mongoose";

const userPermissionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },

    effect: {
      type: String,
      enum: ["ALLOW", "DENY"],
      default: "ALLOW",
    },
  },
  {
    timestamps: true,
  }
);

userPermissionSchema.index(
  {
    schoolId: 1,
    userId: 1,
    permissionId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "UserPermission",
  userPermissionSchema
);