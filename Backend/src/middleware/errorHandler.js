import { ZodError } from "zod";

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      errors: error.issues,
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Request data is invalid",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with these details already exists",
    });
  }

  const statusCode = error.statusCode || error.status || 500;
  if (statusCode >= 500) {
    console.error("Unhandled API error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : error.message,
  });
};
