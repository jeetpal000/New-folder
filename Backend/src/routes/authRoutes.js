import { Router } from "express";
import {
  authLoginController,
  authLogoutController,
  authRefreshController,
  authRegisterController,
  refreshAccessTokenController,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { getCurrentUser } from "../controllers/userController.js";
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
authRouter.get(["/me", "/organisation/me"], authenticate, getCurrentUser);

export default authRouter;