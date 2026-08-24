import type { Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";

import {
  createPost,
  getMyPosts,
  getPublicPosts,
  getPostById,
  updatePost,
  deletePost,
  addPostMedia,
  setPrimaryPostMedia,
  deletePostMedia,
  reorderPostMedia,
} from "../services/postService.js";

import {
  createPostSchema,
  updatePostSchema,
  addPostMediaSchema,
  reorderPostMediaSchema,
} from "../types/post.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import { uploadPostImage } from "../services/cloudinaryService.js";

import cloudinary from "../config/cloudinary.js";

export async function createPostController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = createPostSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid post information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const post = await createPost(req.user.userId, validation.data);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPostsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const posts = await getMyPosts(
      req.user.userId,
      String(req.params.businessId),
    );

    res.status(200).json({
      success: true,
      data: {
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicPostsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const posts = await getPublicPosts(String(req.params.businessId));

    res.status(200).json({
      success: true,
      data: {
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const post = await getPostById(req.user.userId, String(req.params.id));

    res.status(200).json({
      success: true,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePostController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updatePostSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid post information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const post = await updatePost(
      req.user.userId,
      String(req.params.id),
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePostController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    await deletePost(req.user.userId, String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function addPostMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  let uploadedPublicId: string | undefined;

  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.file) {
      throw new AppError("Post image is required", 400);
    }

    const validation = addPostMediaSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid post media information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const uploadedImage = await uploadPostImage(
      req.file.buffer,
      req.file.originalname,
    );

    uploadedPublicId = uploadedImage.public_id;

    const post = await addPostMedia(
      req.user.userId,
      String(req.params.id),
      validation.data,
      {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        type: "image",
      },
    );

    res.status(201).json({
      success: true,
      message: "Post image uploaded successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
        });
      } catch (cleanupError) {
        console.error("Failed to clean up Cloudinary asset:", cleanupError);
      }
    }

    next(error);
  }
}

export async function setPrimaryPostMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const post = await setPrimaryPostMedia(
      req.user.userId,
      String(req.params.id),
      String(req.params.mediaId),
    );

    res.status(200).json({
      success: true,
      message: "Primary post media updated successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePostMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { post, deletedMedia } = await deletePostMedia(
      req.user.userId,
      String(req.params.id),
      String(req.params.mediaId),
    );

    try {
      await cloudinary.uploader.destroy(deletedMedia.publicId, {
        resource_type: deletedMedia.type === "video" ? "video" : "image",
      });
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete post media from Cloudinary:",
        cloudinaryError,
      );
    }

    res.status(200).json({
      success: true,
      message: "Post media deleted successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderPostMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = reorderPostMediaSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid media reorder information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const post = await reorderPostMedia(
      req.user.userId,
      String(req.params.id),
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Post media reordered successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}
