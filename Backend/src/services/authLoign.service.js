// auth.service.js

import crypto from "crypto";
import argon from "argon2";
import { User } from "../models/User.js";
import AppError from "../utils/AppError.js";
import { getClientIp, getDeviceInfo } from "../utils/deviceInfo.js";
import { Session } from "../models/Session.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/token.js";


export const LoginService = async (data, req) => {

  const { email, password } = data;

  // --------------------------------
  // 1. Find User
  // --------------------------------

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }


  // --------------------------------
  // 2. Check Active User
  // --------------------------------

  if (!user.isActive) {
    throw new AppError(
      "Your account is inactive",
      403
    );
  }


  // --------------------------------
  // 3. Verify Password
  // --------------------------------

  const isPasswordValid =
    await argon.verify(
      user.password,
      password
    );

  if (!isPasswordValid) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }


  // --------------------------------
  // 4. Generate Access Token
  // --------------------------------

  const accessToken =
    generateAccessToken({
      userId: user._id,
      organisationId: user.schoolId,
      roleId: user.roleId,
    });


  // --------------------------------
  // 5. Generate Refresh Token
  // --------------------------------

  const refreshToken =
    generateRefreshToken({
      userId: user._id,
    });


  // --------------------------------
  // 6. Generate Device ID
  // --------------------------------

  const deviceId =
    crypto.randomUUID();


  // --------------------------------
  // 7. Get Device Information
  // --------------------------------

  const deviceInfo =
    getDeviceInfo(req);


  // --------------------------------
  // 8. Get IP Address
  // --------------------------------

  const ipAddress =
    getClientIp(req);


  // --------------------------------
  // 9. Device Name
  // --------------------------------

  const deviceName =
    `${deviceInfo.os} - ${deviceInfo.browser}`;


  // --------------------------------
  // 10. Session Expiry
  // --------------------------------

  const expiresAt =
    new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000
    );


  // --------------------------------
  // 11. Create Session
  // --------------------------------

  await Session.create({
    userId: user._id,

    refreshTokenHash: hashRefreshToken(refreshToken),

    deviceId,

    deviceName,

    deviceInfo,

    ipAddress,

    lastActive: new Date(),

    expiresAt,
  });


  // --------------------------------
  // 12. Return
  // --------------------------------

  return {
    accessToken,

    refreshToken,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      organisationId: user.schoolId,
    },
  };
};