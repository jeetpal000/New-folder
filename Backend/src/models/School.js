import mongoose from "mongoose";

const publicHighlightSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["feature", "award", "picnic", "tour", "function"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    imageUrl: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { _id: true },
);

const schoolSchema = new mongoose.Schema({
  schoolName: { type: String, required: true, trim: true },

  slug: {
    type: String,
    unique: true,
    required: true,
  },
  schoolCode: {
    type: String,
    unique: true,
    required: true,
  },
  board: String,
  city: String,
  address: String,
  pincode: String,
  schoolEmail: String,
  schoolPhone: String,
  state: String,
  schoolType: String,
  principalName: String,
  affiliationNumber: String,
  academicSession: String,
  establishedYear: Number,
  logo: String,
  logoPublicId: String,
  bannerImage: String,
  bannerImagePublicId: String,

  admissionOpen: { type: Boolean, default: false },
  facilities: {
    type: [{ type: String, trim: true }],
    default: [],
  },
  publicHighlights: {
    type: [publicHighlightSchema],
    default: [],
  },
  classes: [String],
  isActive: { type: Boolean, default: true },
}, {timestamps: true});

export const School = mongoose.models.School || mongoose.model("School", schoolSchema);