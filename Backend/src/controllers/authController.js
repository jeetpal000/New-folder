import { z, ZodError } from "zod";
import { registrationSchema } from "../schema/registrationSchema.js";
import { LoginService } from "../services/authLoign.service.js";
import { createSchoolSetup } from "../services/schoolSetup.service.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import {
  generateAccessToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import "dotenv/config";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredSameSite = process.env.AUTH_COOKIE_SAME_SITE?.toLowerCase();
  const sameSite = configuredSameSite || (isProduction ? "none" : "lax");
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("AUTH_COOKIE_SAME_SITE must be lax, strict, or none");
  }

  return {
    httpOnly: true,
    secure: isProduction || sameSite === "none",
    sameSite,
    path: "/",
  };
};

const clearAuthCookies = (res) => {
  const options = getAuthCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
};

export const authRegisterController = async (req, res, next) => {
  try {
    const { admin, organisation, profile } = registrationSchema.parse(req.body);
    const result = await createSchoolSetup({
      adminData: admin,
      organisationData: organisation,
      profileData: profile,
    });

    return res.status(201).json({
      success: true,
      message: "School workspace registered successfully",
      data: {
        school: result.school,
        user: result.adminUser,
        subscription: result.subscription,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Registration details are invalid",
        errors: error.issues,
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: error.data || null,
      });
    }
    return next(error);
  }
};

export const authLoginController = async (req, res, next) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const result = await LoginService(credentials, req);
    const cookieOptions = getAuthCookieOptions();

    res.cookie("accessToken", result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User login successful",
      user: result.user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        errors: error.issues,
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: error.data || null,
      });
    }
    return next(error);
  }
};

export const authRefreshController = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }

  const session = await Session.findOne({
    userId: decoded.userId,
    $or: [
      { refreshTokenHash: hashRefreshToken(refreshToken) },
      { refreshToken },
    ],
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "Session expired or revoked",
    });
  }

  const user = await User.findById(decoded.userId).populate("schoolId");
  if (!user || !user.isActive || !user.schoolId?.isActive) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "User or school is unavailable",
    });
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    sessionId: session._id.toString(),
    organisationId: user.schoolId._id.toString(),
    roleId: user.roleId.toString(),
  });

  await Session.updateOne(
    { _id: session._id },
    { $set: { lastActive: new Date() } },
  );
  res.cookie("accessToken", accessToken, {
    ...getAuthCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });

  return res.status(200).json({ success: true });
};

export const refreshAccessTokenController = authRefreshController;

export const authLogoutController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await Session.deleteOne({
        $or: [
          { refreshTokenHash: hashRefreshToken(refreshToken) },
          { refreshToken },
        ],
      });
    }
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    return next(error);
  }
};
