import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  refreshTokenHash: {
    type: String,
    index: true,
  },
  deviceId: String,
  deviceName: {
    type: String,
    required: true,
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
  },
  ipAddress: String,
  lastActive: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {timestamps: true});

sessionSchema.index(
  {expiresAt: 1},
  {expireAfterSeconds: 0}
);

export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
