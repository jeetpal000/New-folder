import { Router } from "express";
import {
  getPublicSchoolProfile,
  getWebsiteFeedback,
  lookupPublicStudent,
  searchPublicSchools,
  submitWebsiteFeedback,
  updateWebsiteFeedback,
  submitAdmissionApplication,
  submitPublicLeaveRequest,
} from "../controllers/publicSchoolController.js";
import {
  publicLookupLimiter,
  publicSubmissionLimiter,
} from "../lib/apiLimiter.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/permit.js";
import { requirePlatformFeedbackAdmin } from "../middleware/requirePlatformFeedbackAdmin.js";

const router = Router();

router.get("/schools", searchPublicSchools);
router.post("/feedback", publicSubmissionLimiter, submitWebsiteFeedback);
router.get(
  "/admin/website-feedback",
  authenticate,
  requireRole("Admin"),
  requirePlatformFeedbackAdmin,
  getWebsiteFeedback,
);
router.patch(
  "/admin/website-feedback/:id",
  authenticate,
  requireRole("Admin"),
  requirePlatformFeedbackAdmin,
  updateWebsiteFeedback,
);
router.get("/schools/:slug", getPublicSchoolProfile);
router.post(
  "/schools/:slug/admissions",
  publicSubmissionLimiter,
  submitAdmissionApplication,
);
router.post(
  "/schools/:slug/students/lookup",
  publicLookupLimiter,
  lookupPublicStudent,
);
router.post(
  "/schools/:slug/leaves",
  publicSubmissionLimiter,
  submitPublicLeaveRequest,
);

export default router;
