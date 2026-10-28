import { Router } from "express";
import {
  authLoginController,
  authLogoutController,
  authRefreshController,
  authRegisterController,
  refreshAccessTokenController,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  getAllSessionData,
  getCurrentUser,
  deleteSessionItem,
  updateMyProfile,
} from "../controllers/userController.js";
import { authenticationLimiter } from "../lib/apiLimiter.js";

const authRouter = Router();

authRouter.post(
  ["/register", "/organisations/register"],
  authenticationLimiter,
  authRegisterController,
);
authRouter.post(
  ["/login", "/organisations/login"],
  authenticationLimiter,
  authLoginController,
);
authRouter.post("/organisations/refresh", authRefreshController);
authRouter.post("/refresh-token", refreshAccessTokenController);
authRouter.post("/logout", authLogoutController);
authRouter.delete("/delete-session/:id", authenticate, deleteSessionItem);
authRouter.get(["/me", "/organisation/me"], authenticate, getCurrentUser);
authRouter.put("/profile/me", authenticate, updateMyProfile);
authRouter.get("/get-all-session", authenticate, getAllSessionData);

export default authRouter;