import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";

import {
  createBusiness,
  getBusinessById,
  getMyBusinesses,
  selectBusiness,
  updateBusiness,
  deleteBusiness,
  getPublicBusinesses,
  getPublicBusinessById,
  getPublicBusinessProducts,
  getBusinessWhatsAppLink,
} from "../services/businessService.js";

import {
  uploadBusinessImage as uploadBusinessImageToCloudinary,
} from "../services/cloudinaryService.js";

import {
  createBusinessSchema,
  publicBusinessQuerySchema,
  updateBusinessSchema,
} from "../types/business.js";

import { publicProductQuerySchema } from "../types/product.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import Business from "../models/Business.js";

export async function createBusinessController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = createBusinessSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid business information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const business = await createBusiness(req.user.userId, validation.data);

    res.status(201).json({
      success: true,
      message: "Business created successfully",
      data: {
        business,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBusinessesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const businesses = await getMyBusinesses(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        businesses,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function selectBusinessController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const business = await selectBusiness(
      String(req.params.id),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Business selected successfully",
      data: {
        business,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const business = await getBusinessById(
      String(req.params.id),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      data: {
        business,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updateBusinessSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid business information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const business = await updateBusiness(
      String(req.params.id),
      req.user.userId,
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: {
        business,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBusinessController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    await deleteBusiness(String(req.params.id), req.user.userId);

    res.status(200).json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicBusinessesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = publicBusinessQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid business query",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await getPublicBusinesses(validation.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicBusinessController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const business = await getPublicBusinessById(String(req.params.id));

    res.status(200).json({
      success: true,
      data: {
        business,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicBusinessProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = publicProductQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product query",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await getPublicBusinessProducts(
      String(req.params.businessId),
      validation.data,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessWhatsAppLinkController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const message =
      typeof req.query.message === "string" ? req.query.message : undefined;

    const result = await getBusinessWhatsAppLink(
      String(req.params.businessId),
      message,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadBusinessImageController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select an image to upload",
      });
      return;
    }

    const type =
      req.body.type === "cover"
        ? "cover"
        : req.body.type === "logo"
          ? "logo"
          : null;

    if (!type) {
      res.status(400).json({
        success: false,
        message: "Image type must be logo or cover",
      });
      return;
    }

    const business = await Business.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!business) {
      throw new AppError(
        "Business not found or you do not have permission to modify it",
        404,
      );
    }

    const uploadedImage = await uploadBusinessImageToCloudinary(
      req.file.buffer,
      req.file.originalname,
      type,
    );

    if (type === "logo") {
      business.logo = uploadedImage.secure_url;
    } else {
      business.coverImage = uploadedImage.secure_url;
    }

    await business.save();

    res.status(200).json({
      success: true,
      message: "Business image uploaded successfully",
      data: {
        business,
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        type,
      },
    });
  } catch (error) {
    next(error);
  }
}
