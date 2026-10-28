import multer from "multer";
import AppError from "../utils/AppError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new AppError("Upload a JPG, PNG or WebP image", 400));
      return;
    }
    callback(null, true);
  },
});

export const uploadSchoolImageFile = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return next(
        new AppError(
          tooLarge
            ? "School image must be 5 MB or smaller"
            : "Upload one school image at a time",
          tooLarge ? 413 : 400,
        ),
      );
    }
    return next(error);
  });
};
