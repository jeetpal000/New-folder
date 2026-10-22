import { Router } from "express";
import {
  getMonthlyAttendance,
  getAttendanceRoster,
  lockAttendanceMonth,
  saveAttendanceHoliday,
  saveMonthlyAttendance,
  saveAttendance,
} from "../controllers/attendanceController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permit.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = Router();

router.get(
  "/attendance/month",
  authenticate,
  requirePermission(["attendance.view", "attendance.mark"]),
  getMonthlyAttendance,
);
router.post(
  "/attendance/month",
  authenticate,
  requireActiveSubscription,
  requirePermission("attendance.mark"),
  saveMonthlyAttendance,
);
router.post(
  "/attendance/month/lock",
  authenticate,
  requireActiveSubscription,
  requirePermission("attendance.mark"),
  lockAttendanceMonth,
);
router.put(
  "/attendance/holiday",
  authenticate,
  requireActiveSubscription,
  requirePermission("attendance.mark"),
  saveAttendanceHoliday,
);
router.get(
  "/attendance",
  authenticate,
  requirePermission(["attendance.view", "attendance.mark"]),
  getAttendanceRoster,
);
router.post(
  "/attendance",
  authenticate,
  requireActiveSubscription,
  requirePermission("attendance.mark"),
  saveAttendance,
);

export default router;
