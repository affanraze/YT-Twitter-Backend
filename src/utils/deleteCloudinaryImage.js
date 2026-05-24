import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";

const delFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "failed to delete file from cloudinary"
    );
  }
};

export { delFromCloudinary };
