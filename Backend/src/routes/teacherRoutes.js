// routes/teacher.routes.js

import express from "express";
import {
  createTeacherController,
  getTeachersController,
} from "../controllers/teacherController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = express.Router();

router.get(
  "/get-teachers",
  authenticate,
  requirePermission("teacher.view"),
  getTeachersController,
);
router.post(
  "/add-teacher",
  authenticate,
  requireActiveSubscription,
  requirePermission("teacher.create"),
  createTeacherController,
);

export default router;