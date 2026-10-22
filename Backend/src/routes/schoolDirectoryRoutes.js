import { Router } from "express";
import {
  getPublicSchoolProfile,
  lookupPublicStudent,
  searchPublicSchools,
  submitAdmissionApplication,
  submitPublicLeaveRequest,
} from "../controllers/publicSchoolController.js";
import {
  publicLookupLimiter,
  publicSubmissionLimiter,
} from "../lib/apiLimiter.js";

const router = Router();

router.get("/schools", searchPublicSchools);
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
