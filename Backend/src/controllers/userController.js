import mongoose from "mongoose";
import { Session } from "../models/Session.js";
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

export const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 120 ||
      typeof phone !== "string" ||
      !phone.trim() ||
      phone.trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name and phone number",
      });
    }

    req.user.name = name.trim();
    req.user.phone = phone.trim();
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Account profile updated",
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllSessionData = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const currentSessionId = req.auth.sessionId;

    const sessions = await Session.find({ userId })
      .select("-refreshTokenHash")
      .sort({ lastActive: -1 })
      .lean();

    const result = sessions.map((session) => ({
      ...session,
      isCurrentDevice:
        String(session._id) === String(currentSessionId),
    }));

    return res.status(200).json({
      success: true,
      sessions: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSessionItem  = async(req, res, next)=>{
  try {
    const {id} = req.params;

    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({success: false, message: "Invalid session or school id"});
    }

    const deleteSession = await Session.findOneAndDelete({_id: id});

    if(!deleteSession) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    return res.status(200).json({
        success: true,
        message: "Session deleted successfully"
      });
    
  } catch (error) {
    console.log("Session Deleted Error: ", error);
    next(error);
  }
}