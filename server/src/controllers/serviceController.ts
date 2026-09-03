import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";

import {
  createService,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  getPublicServices,
  getPublicMarketplaceServices,
  getDeletedServices,
  restoreService,
} from "../services/serviceService.js";

import { createServiceSchema, updateServiceSchema } from "../types/service.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export async function createServiceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = createServiceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid service information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const service = await createService(req.user.userId, validation.data);

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        service,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyServicesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    const result = await getMyServices(
      req.user.userId,
      String(req.params.businessId),
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicMarketplaceServicesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const services = await getPublicMarketplaceServices();

    res.status(200).json({
      success: true,
      data: {
        services,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicServicesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const services = await getPublicServices(String(req.params.businessId));

    res.status(200).json({
      success: true,
      data: {
        services,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getServiceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const service = await getServiceById(
      req.user.userId,
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: {
        service,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateServiceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updateServiceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid service information",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const service = await updateService(
      req.user.userId,
      String(req.params.id),
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: {
        service,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteServiceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    await deleteService(req.user.userId, String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}


export async function getDeletedServicesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const services = await getDeletedServices(
      req.user.userId,
      String(req.params.businessId),
    );

    res.status(200).json({
      success: true,
      data: {
        services,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreServiceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const service = await restoreService(
      req.user.userId,
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      message: "Service restored successfully",
      data: {
        service,
      },
    });
  } catch (error) {
    next(error);
  }
}
