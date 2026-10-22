import { Router } from "express";
import {
  assignClassTeacher,
  getAdminPublicSchoolProfile,
  getClassTeacherAssignments,
  listAdmissionApplications,
  listLeaveRequests,
  reviewAdmissionApplication,
  reviewLeaveRequest,
  updateAdminPublicSchoolProfile,
} from "../controllers/publicSchoolController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = Router();

const requireAdmin = requireRole("Admin");

router.get(
  "/admin/admission-applications",
  authenticate,
  requireAdmin,
  listAdmissionApplications,
);
router.get(
  "/admin/public-profile",
  authenticate,
  requireAdmin,
  getAdminPublicSchoolProfile,
);
router.put(
  "/admin/public-profile",
  authenticate,
  requireActiveSubscription,
  requireAdmin,
  updateAdminPublicSchoolProfile,
);
router.get(
  "/admin/class-teacher-assignments",
  authenticate,
  requireAdmin,
  getClassTeacherAssignments,
);
router.put(
  "/admin/classes/:classId/class-teacher",
  authenticate,
  requireActiveSubscription,
  requireAdmin,
  assignClassTeacher,
);
router.patch(
  "/admin/admission-applications/:applicationId",
  authenticate,
  requireActiveSubscription,
  requireAdmin,
  reviewAdmissionApplication,
);
router.get("/leave-requests", authenticate, listLeaveRequests);
router.patch(
  "/leave-requests/:requestId",
  authenticate,
  requireActiveSubscription,
  reviewLeaveRequest,
);

export default router;
