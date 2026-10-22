import { Router } from "express";
import {
  createSubscriptionOrder,
  getSchoolBilling,
  verifySubscriptionPayment,
} from "../services/billing.service.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/permit.js";

const router = Router();

router.get("/billing", authenticate, requireRole("Admin"), getSchoolBilling);
router.post(
  "/billing/orders",
  authenticate,
  requireRole("Admin"),
  createSubscriptionOrder,
);
router.post(
  "/billing/verify",
  authenticate,
  requireRole("Admin"),
  verifySubscriptionPayment,
);

export default router;
