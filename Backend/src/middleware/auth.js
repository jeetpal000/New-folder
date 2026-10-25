import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/token.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";

export const authenticate = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name,
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    return next(error);
  }

  if (!mongoose.isValidObjectId(decoded.userId)) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
  if(!mongoose.isValidObjectId(decoded.sessionId)){
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  try {
     // Check whether the session still exists
    const session = await Session.findOne({
      _id: decoded.sessionId,
      userId: decoded.userId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(401).json({
        success: false,
        message: "Session expired or revoked. Please login again.",
      });
    }

    //Fetch User
    const user = await User.findById(decoded.userId)
      .populate("schoolId")
      .populate({
        path: "roleId",
        populate: { path: "permission" },
      });

    if (!user || !user.isActive || !user.schoolId) {
      return res.status(401).json({
        success: false,
        message: "User is unavailable",
      });
    }

    if (!user.schoolId.isActive) {
      return res.status(403).json({
        success: false,
        message: "This school workspace is inactive",
      });
    }

    if (!user.roleId) {
      return res.status(403).json({
        success: false,
        message: "User role is unavailable",
      });
    }
    if (
      user.roleId.schoolId &&
      String(user.roleId.schoolId) !== String(user.schoolId._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "User role does not belong to this school",
      });
    }

    req.user = user;
    req.auth = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
