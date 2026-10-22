import UserPermission from "../models/UserPermission.js";
import { getRoleName } from "../utils/role.js";

export const getCurrentUser = async (req, res) => {
  const rolePermissions = (req.user.roleId?.permission || [])
    .map((permission) => permission.key || permission.name)
    .filter(Boolean);
  const userPermissions = await UserPermission.find({
    schoolId: req.user.schoolId._id,
    userId: req.user._id,
  })
    .populate("permissionId", "key name")
    .lean();

  const effectivePermissions = new Set(rolePermissions);
  userPermissions.forEach(({ permissionId, effect }) => {
    const key = permissionId?.key || permissionId?.name;
    if (!key) return;
    if (effect === "DENY") effectivePermissions.delete(key);
    if (effect === "ALLOW") effectivePermissions.add(key);
  });

  return res.status(200).json({
    success: true,
    user: {
      ...req.user.toObject(),
      roleId: {
        ...req.user.roleId.toObject(),
        role: getRoleName(req.user.roleId) || "Staff",
      },
      permissions: [...effectivePermissions],
    },
  });
};