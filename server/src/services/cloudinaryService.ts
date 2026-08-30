import { UploadApiResponse } from "cloudinary";

import cloudinary from "../config/cloudinary.js";

export async function uploadProductImage(
  buffer: Buffer,
  originalName: string,
): Promise<UploadApiResponse> {
  const extension =
    originalName.split(".").pop()?.toLowerCase() || "jpg";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "denvia/products",
        resource_type: "image",
        format: extension,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(
            new Error("Cloudinary upload returned no result"),
          );
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

export async function uploadPostImage(
  buffer: Buffer,
  originalName: string,
): Promise<UploadApiResponse> {
  const extension =
    originalName.split(".").pop()?.toLowerCase() || "jpg";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "denvia/posts",
        resource_type: "image",
        format: extension,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(
            new Error("Cloudinary upload returned no result"),
          );
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

export async function uploadBusinessImage(
  buffer: Buffer,
  originalName: string,
  type: "logo" | "cover",
): Promise<UploadApiResponse> {
  const extension =
    originalName.split(".").pop()?.toLowerCase() || "jpg";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `denvia/businesses/${type}`,
        resource_type: "image",
        format: extension,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(
            new Error(
              "Cloudinary upload returned no result",
            ),
          );
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}