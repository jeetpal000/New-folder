import { Router } from "express";
import {
  createStudent,
  getStudents,
  studentAllDetails,
  updateStudent,
} from "../controllers/studentController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission, requireRole } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";
import { uploadStudentPhotoFile } from "../middleware/studentPhotoUpload.js";

const router = Router();

router.get(
  "/students",
  authenticate,
  requirePermission("student.view"),
  getStudents,
);
router.post(
  "/students",
  authenticate,
  requireActiveSubscription,
  requirePermission("student.create"),
  uploadStudentPhotoFile,
  createStudent,
);
router.put(
  "/students/:id",
  authenticate,
  requireActiveSubscription,
  requirePermission("student.update"),
  uploadStudentPhotoFile,
  updateStudent,
);
router.get(
  "/student-alldetails/:id",
  authenticate,
  requireRole("Admin"),
  requirePermission("student.view"),
  studentAllDetails,
);

export default router;
