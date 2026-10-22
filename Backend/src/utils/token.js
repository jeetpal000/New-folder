import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config"

export const generateAccessToken = (payload)=>{
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m"
    }
  )
};
export const generateRefreshToken = (payload)=>{
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d"
    }
  )
};

export const verifyAccessToken = (token) => jwt.verify(
  token,
  process.env.ACCESS_TOKEN_SECRET
);

export const verifyRefreshToken = (token) => jwt.verify(
  token,
  process.env.REFRESH_TOKEN_SECRET
);

export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
