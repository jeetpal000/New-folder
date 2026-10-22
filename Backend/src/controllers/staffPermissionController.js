import { Permission } from "../models/Permission.js";
import { User } from "../models/User.js";
import UserPermission from "../models/UserPermission.js";
import { getRoleName } from "../utils/role.js";

const STAFF_PERMISSION_KEYS = [
  "attendance.view",
  "attendance.mark",
  "student.view",
  "student.create",
  "student.update",
  "teacher.view",
  "teacher.create",
  "subject.view",
  "subject.create",
  "subject.delete",
  "fees.view",
  "fees.account.create",
  "fees.payment.record",
  "assessment.view",
  "assessment.create",
  "assessment.mark",
  "assessment.publish",
];

export const getStaffPermissions = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const [users, permissions] = await Promise.all([
      User.find({ schoolId, isActive: true })
        .select("name email roleId")
        .populate({
          path: "roleId",
          select: "role name permission",
          populate: { path: "permission", select: "key name" },
        })
        .lean(),
      Permission.find({
        $or: [
          { key: { $in: STAFF_PERMISSION_KEYS } },
          { name: { $in: STAFF_PERMISSION_KEYS } },
        ],
      })
        .select("key name description")
        .lean(),
    ]);
    const userIds = users
      .filter((user) => getRoleName(user.roleId) !== "Admin")
      .map((user) => user._id);
    const overrides = await UserPermission.find({
      schoolId,
      userId: { $in: userIds },
    })
      .populate("permissionId", "key name")
      .lean();

    const staff = users
      .filter((user) => getRoleName(user.roleId) !== "Admin")
      .map((user) => {
        const roleKeys = (user.roleId?.permission || [])
          .map((permission) => permission.key || permission.name)
          .filter(Boolean);
        const effective = new Set(roleKeys);

        overrides
          .filter((override) => String(override.userId) === String(user._id))
          .forEach((override) => {
            const key =
              override.permissionId?.key || override.permissionId?.name;
            if (!key) return;
            if (override.effect === "DENY") effective.delete(key);
            if (override.effect === "ALLOW") effective.add(key);
          });

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: getRoleName(user.roleId) || "Staff",
          permissions: STAFF_PERMISSION_KEYS.filter((key) =>
            effective.has(key),
          ),
        };
      });

    return res.status(200).json({
      success: true,
      permissions: STAFF_PERMISSION_KEYS.map((key) => ({
        key,
        name: permissions.find((permission) => permission.key === key)
          ?.description || key,
      })),
      staff,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateStaffPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const schoolId = req.user.schoolId._id;

    if (
      !Array.isArray(permissions) ||
      permissions.some(
        (permission) =>
          typeof permission !== "string" ||
          !STAFF_PERMISSION_KEYS.includes(permission),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Permissions must contain valid staff permission keys",
      });
    }

    const targetUser = await User.findOne({
      _id: userId,
      schoolId,
      isActive: true,
    }).populate({
      path: "roleId",
      select: "role name permission",
      populate: { path: "permission", select: "key name" },
    });
    if (
      !targetUser ||
      getRoleName(targetUser.roleId) === "Admin"
    ) {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    const permissionRecords = await Permission.find({
      $or: [
      { key: { $in: STAFF_PERMISSION_KEYS } },
      { name: { $in: STAFF_PERMISSION_KEYS } },
      ],
    }).select("_id key name");
    const permissionIds = new Map(
      permissionRecords.map((permission) => [
        permission.key || permission.name,
        permission._id,
      ]),
    );
    const missingKeys = STAFF_PERMISSION_KEYS.filter(
      (key) => !permissionIds.has(key),
    );
    if (missingKeys.length) {
      return res.status(503).json({
        success: false,
        message: "Permission catalog is not initialized",
      });
    }

    await Promise.all(
      STAFF_PERMISSION_KEYS.map((key) =>
        UserPermission.updateOne(
          { schoolId, userId: targetUser._id, permissionId: permissionIds.get(key) },
          { $set: { effect: permissions.includes(key) ? "ALLOW" : "DENY" } },
          { upsert: true },
        ),
      ),
    );

    return res.status(200).json({
      success: true,
      message: "Staff permissions updated",
    });
  } catch (error) {
    return next(error);
  }
};
