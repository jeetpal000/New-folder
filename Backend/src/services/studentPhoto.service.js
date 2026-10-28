import { v2 as cloudinary } from "cloudinary";
import AppError from "../utils/AppError.js";

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError("Image storage is not configured", 503);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const uploadStudentPhoto = (file, schoolId, folder = "students") => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `${folder}/${schoolId}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(new AppError("Could not upload image to Cloudinary", 502));
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new AppError("Cloudinary returned an invalid image response", 502));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    upload.end(file.buffer);
  });
};

export const destroyStudentPhoto = async (publicId) => {
  if (!publicId) return;

  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
  if (!["ok", "not found"].includes(result.result)) {
    throw new AppError("Could not delete image from Cloudinary", 502);
  }
};
