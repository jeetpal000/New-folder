import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import apiLimiter from "./src/lib/apiLimiter.js";
import { connectDatabase } from "./src/config/db.js";
import subjectRouter from "./src/routes/subjectRoutes.js";
import authRouter from "./src/routes/authRoutes.js";
import teacherRouter from "./src/routes/teacherRoutes.js";
import dashboardRouter from "./src/routes/dashboardRoutes.js";
import studentRouter from "./src/routes/studentRoutes.js";
import attendanceRouter from "./src/routes/attendanceRoutes.js";
import feeRouter from "./src/routes/feeRoutes.js";
import assessmentRouter from "./src/routes/assessmentRoutes.js";
import schoolDirectoryRouter from "./src/routes/schoolDirectoryRoutes.js";
import schoolWorkflowRouter from "./src/routes/schoolWorkflowRoutes.js";
import billingRouter from "./src/routes/billingRoutes.js";
import { seedPermissions } from "./src/config/Permission.seed.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { handleRazorpayWebhook } from "./src/services/billing.service.js";



const app = express();
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(express.json({
  limit: "1mb",
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) =>
    callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true,
}));

app.use("/api/v1", (req, res, next) => {
  const origin = req.get("origin");
  if (!origin || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  if (allowedOrigins.has(origin)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Request origin is not allowed",
  });
});

app.use("/api/v1", apiLimiter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend ready for MongoDB setup" });
});

app.post("/api/v1/billing/webhook", handleRazorpayWebhook);
app.use("/api/v1/directory", schoolDirectoryRouter);
app.use("/api/v1/public", schoolDirectoryRouter);
app.use("/api/v1", authRouter);
app.use("/api/v1", billingRouter);
app.use("/api/v1", subjectRouter);
app.use("/api/v1", teacherRouter);
app.use("/api/v1", dashboardRouter);
app.use("/api/v1", studentRouter);
app.use("/api/v1", attendanceRouter);
app.use("/api/v1", feeRouter);
app.use("/api/v1", assessmentRouter);
app.use("/api/v1", schoolWorkflowRouter);
app.use(errorHandler);



const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDatabase();
  await seedPermissions();
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});