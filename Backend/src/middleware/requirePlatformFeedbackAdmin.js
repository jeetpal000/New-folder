
export const requirePlatformFeedbackAdmin = (req, res, next) => {
  const configuredEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) {
    return res.status(503).json({
      success: false,
      message: "The platform feedback inbox is not configured",
    });
  }
  if (req.user?.email?.trim().toLowerCase() !== configuredEmail) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to platform feedback",
    });
  }
  return next();
};
