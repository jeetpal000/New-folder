import {Router} from "express";
import { authenticate } from "../middleware/auth.js";
import {
  addClassController,
  addSubjectController,
  deleteSubjectController,
  getClassesController,
  getSubjectController,
} from "../controllers/subjectController.js";
import { requirePermission, requireRole } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";


const subjectRouter = Router();

subjectRouter.post(
  "/add-subject",
  authenticate,
  requireActiveSubscription,
  requirePermission("subject.create"),
  addSubjectController,
);
subjectRouter.get(
  "/get-subject",
  authenticate,
  requirePermission(["subject.view", "assessment.create"]),
  getSubjectController,
);
subjectRouter.delete(
  "/delete-subject/:id",
  authenticate,
  requireActiveSubscription,
  requirePermission("subject.delete"),
  deleteSubjectController,
);
subjectRouter.get("/get-classes", authenticate, getClassesController);
subjectRouter.post(
  "/add-class",
  authenticate,
  requireActiveSubscription,
  requireRole("Admin"),
  addClassController,
);
// subjectRouter.get("/edit-subject", authenticate, deleteSubjectController);

export default subjectRouter;