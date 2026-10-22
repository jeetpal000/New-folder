class AppError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);

    this.statusCode = statusCode;
    this.data = data;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
