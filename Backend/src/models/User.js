import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
}, {timestamps: true});
userSchema.index(
  {schoolId: 1, email: 1},
  {unique: true}
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);