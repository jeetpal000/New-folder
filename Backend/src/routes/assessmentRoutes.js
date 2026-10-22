import { Router } from "express";
import {
  createAssessment,
  getAssessmentResults,
  listAssessments,
  publishAssessmentResults,
  saveAssessmentResults,
} from "../controllers/assessmentController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = Router();

router.get(
  "/assessments",
  authenticate,
  requirePermission("assessment.view"),
  listAssessments,
);
router.post(
  "/assessments",
  authenticate,
  requireActiveSubscription,
  requirePermission("assessment.create"),
  createAssessment,
);
router.get(
  "/assessments/:assessmentId/results",
  authenticate,
  requirePermission("assessment.view"),
  getAssessmentResults,
);
router.put(
  "/assessments/:assessmentId/results",
  authenticate,
  requireActiveSubscription,
  requirePermission("assessment.mark"),
  saveAssessmentResults,
);
router.post(
  "/assessments/:assessmentId/publish",
  authenticate,
  requireActiveSubscription,
  requirePermission("assessment.publish"),
  publishAssessmentResults,
);

export default router;
