import { Router } from "express";
import {
  createFeeAccount,
  getFeeAccounts,
  recordFeePayment,
} from "../controllers/feeController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = Router();

router.get(
  "/fees/accounts",
  authenticate,
  requirePermission("fees.view"),
  getFeeAccounts,
);
router.post(
  "/fees/accounts",
  authenticate,
  requireActiveSubscription,
  requirePermission("fees.account.create"),
  createFeeAccount,
);
router.post(
  "/fees/accounts/:accountId/payments",
  authenticate,
  requireActiveSubscription,
  requirePermission("fees.payment.record"),
  recordFeePayment,
);

export default router;
