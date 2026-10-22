import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
  role: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  permission: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission"
    }
  ]
}, {timestamps: true});

export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);