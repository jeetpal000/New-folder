// routes/teacher.routes.js

import express from "express";
import {
  createTeacherController,
  getTeachersController,
  getTeacherDetailsController,
  updateTeacherController,
  createTeacherPayoutController,
  updateTeacherPayoutController,
} from "../controllers/teacherController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";
import { uploadStudentPhotoFile } from "../middleware/studentPhotoUpload.js";

const router = express.Router();

router.get(
  "/get-teachers",
  authenticate,
  requirePermission("teacher.view"),
  getTeachersController,
);
router.get(
  "/teachers/:id",
  authenticate,
  requirePermission("teacher.view"),
  getTeacherDetailsController,
);
router.put(
  "/teachers/:id",
  authenticate,
  requirePermission("teacher.update"),
  uploadStudentPhotoFile,
  updateTeacherController,
);
router.post(
  "/teachers/:id/payouts",
  authenticate,
  requirePermission("teacher.update"),
  createTeacherPayoutController,
);
router.patch(
  "/teachers/:id/payouts/:payoutId",
  authenticate,
  requirePermission("teacher.update"),
  updateTeacherPayoutController,
);
router.post(
  "/add-teacher",
  authenticate,
  requireActiveSubscription,
  requirePermission("teacher.create"),
  createTeacherController,
);

export default router;