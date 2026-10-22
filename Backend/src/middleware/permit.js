import UserPermission from "../models/UserPermission.js";
import { getRoleName } from "../utils/role.js";

export const requirePermission = (permissionKey) => {
  const permissionKeys = Array.isArray(permissionKey)
    ? permissionKey
    : [permissionKey];
  return async (req, res, next) => {
    try {
      if (getRoleName(req.user.roleId) === "Admin") {
        return next();
      }

      const rolePermissions =
        req.user.roleId?.permission || [];
      const rolePermissionKeys = new Set(
        rolePermissions.map((permission) => permission.key || permission.name),
      );

      const userPermissions =
        await UserPermission.find({
          schoolId: req.user.schoolId._id,
          userId: req.user._id,
        })
          .populate("permissionId", "key name")
          .lean();
      const overrides = new Map(
        userPermissions.map((item) => [
          item.permissionId?.key || item.permissionId?.name,
          item.effect,
        ]),
      );

      const hasPermission = permissionKeys.some((key) => {
        const effect = overrides.get(key);
        if (effect === "DENY") return false;
        if (effect === "ALLOW") return true;
        return rolePermissionKeys.has(key);
      });

      if (hasPermission) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "You do not have permission",
      });
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    const roleName = getRoleName(req.user?.roleId);
    if (roles.includes(roleName)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "You do not have access to this resource",
    });
  };
};