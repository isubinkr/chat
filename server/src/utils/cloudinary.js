import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { ApiError } from "./ApiError.js";
import { getBase64 } from "../lib/helper.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    return formattedResults;
  } catch (error) {
    // console.log(error);
    throw new ApiError(500, "Error uploading files to cloudinary", [error]);
  }
};

const deleteFilesFromCloudinaray = async (publicIds) => {
  // delete files from cloudinary
};

export { uploadFilesToCloudinary, deleteFilesFromCloudinaray };
