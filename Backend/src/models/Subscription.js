import mongoose from "mongoose";

const subscripionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  plan: {
    type: String,
    enum:["free", "basic", "premium"],
    required: true,
  },
  maxStudents: { type: Number, required: true },
  maxTeachers: { type: Number, required: true },
  maxAdmin: { type: Number, default: 5 },
  studentCount: { type: Number, min: 0, default: 0 },
  teacherCount: { type: Number, min: 0, default: 0 },
  adminCount: { type: Number, min: 0, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  status: {
    type: String,
    enum: ["pending", "active", "expired", "cancelled"],
    default: "active"
  },
  paymentStatus: {
    type: String,
    enum: [
      "pending",
      "paid",
      "failed",
      "refunded"
    ],
    default: "pending",
  },
  amount: {
    type: Number,
    default: 0,
  },
  isTrial: {
    type: Boolean,
    default: false,
  },
  paymentProvider: {
    type: String,
    enum: ["razorpay"],
  },
  orderId: {
    type: String,
    sparse: true,
  },
  paymentId: String,
}, {timestamps: true});

subscripionSchema.index({ orderId: 1 }, { unique: true, sparse: true });
subscripionSchema.index(
  { schoolId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscripionSchema);
export const Subscripion = Subscription;