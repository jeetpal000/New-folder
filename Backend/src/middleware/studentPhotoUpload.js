import multer from "multer";
import AppError from "../utils/AppError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new AppError("Student photo must be an image", 400));
      return;
    }
    callback(null, true);
  },
});

export const uploadStudentPhotoFile = (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return next(
        new AppError(
          error.code === "LIMIT_FILE_SIZE"
            ? "Student photo must be 5 MB or smaller"
            : "Only one student photo can be uploaded",
          statusCode,
        ),
      );
    }
    return next(error);
  });
};
