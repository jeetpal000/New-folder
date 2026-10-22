import { Router } from "express";
import {
  getAdminDashboard,
  getStaffDashboard,
} from "../controllers/dashboardController.js";
import {
  getStaffPermissions,
  updateStaffPermissions,
} from "../controllers/staffPermissionController.js";
import { authenticate } from "../middleware/auth.js";
import { getRoleName } from "../utils/role.js";
import requireActiveSubscription from "../middleware/requireActiveSubscription.js";

const router = Router();

router.get("/dashboard/admin", authenticate, (req, res, next) => {
  if (getRoleName(req.user.roleId) !== "Admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return getAdminDashboard(req, res, next);
});

router.get("/dashboard/staff", authenticate, (req, res, next) => {
  if (getRoleName(req.user.roleId) === "Admin") {
    return res.status(403).json({ success: false, message: "Staff access required" });
  }
  return getStaffDashboard(req, res, next);
});

router.get("/admin/staff-permissions", authenticate, (req, res, next) => {
  if (getRoleName(req.user.roleId) !== "Admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return getStaffPermissions(req, res, next);
});

router.put(
  "/admin/staff-permissions/:userId",
  authenticate,
  requireActiveSubscription,
  (req, res, next) => {
    if (getRoleName(req.user.roleId) !== "Admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    return updateStaffPermissions(req, res, next);
  },
);

export default router;
