import type { Request, Response, NextFunction } from "express";
import { toPublicProduct } from "../utils/productResponse.js";

import { AppError } from "../utils/AppError.js";

import {
  createProduct,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductMedia,
  setPrimaryProductMedia,
  deleteProductMedia,
  reorderProductMedia,
  getPublicProducts,
  getPublicProductById,
} from "../services/productService.js";

import {
  addProductMediaSchema,
  createProductSchema,
  updateProductSchema,
  reorderProductMediaSchema,
  publicProductQuerySchema,
} from "../types/product.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { uploadProductImage as uploadImageToCloudinary } from "../services/cloudinaryService.js";
import cloudinary from "../config/cloudinary.js";

export async function createProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = createProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const product = await createProduct(req.user.userId, validation.data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyProductsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const products = await getMyProducts(
      req.user.userId,
      String(req.params.businessId),
    );

    res.status(200).json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const product = await getProductById(
      req.user.userId,
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updateProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const product = await updateProduct(
      req.user.userId,
      String(req.params.id),
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    await deleteProduct(req.user.userId, String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function addProductMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = addProductMediaSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product media information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const product = await addProductMedia(
      req.user.userId,
      req.params.id as string,
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Product media added successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function setPrimaryProductMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const product = await setPrimaryProductMedia(
      req.user.userId,
      req.params.id as string,
      req.params.mediaId as string,
    );

    res.status(200).json({
      success: true,
      message: "Primary product image updated successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderProductMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = reorderProductMediaSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid media reorder information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const product = await reorderProductMedia(
      req.user.userId,
      req.params.id as string,
      validation.data.mediaIds,
    );

    res.status(200).json({
      success: true,
      message: "Product media reordered successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductMediaController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const product = await deleteProductMedia(
      req.user.userId,
      req.params.id as string,
      req.params.mediaId as string,
    );

    res.status(200).json({
      success: true,
      message: "Product media deleted successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadProductMediaController(
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
      throw new AppError("Product image is required", 400);
    }

    const productId = req.params.id as string;

    const product = await getProductById(req.user.userId, productId);

    if (product.media.length >= 10) {
      throw new AppError("A product can have a maximum of 10 images", 400);
    }

    const uploadedImage = await uploadImageToCloudinary(
      req.file.buffer,
      req.file.originalname,
    );

    uploadedPublicId = uploadedImage.public_id;

    const isPrimary = product.media.length === 0;

    product.media.push({
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
      alt: req.body.alt,
      isPrimary,
      sortOrder: product.media.length,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product image uploaded successfully",
      data: {
        product,
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

export async function getPublicProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = publicProductQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product query parameters",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await getPublicProducts(validation.data);

    const products = result.products.map(toPublicProduct);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicProductController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await getPublicProductById(String(req.params.id));

    res.status(200).json({
      success: true,
      data: {
        product: toPublicProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}
