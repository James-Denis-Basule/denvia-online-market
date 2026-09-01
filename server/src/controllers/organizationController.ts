import type { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationBusinesses,
  addBusinessToOrganization,
  transferBusinessToOrganization,
} from "../services/organizationService.js";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "../types/organization.js";

export async function createOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = createOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid organization information",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const organization = await createOrganization(
      req.user.userId,
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrganizationsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const organizations = await getMyOrganizations(req.user.userId);

    res.status(200).json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const organization = await getOrganizationById(
      String(req.params.id),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updateOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid organization information",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const organization = await updateOrganization(
      String(req.params.id),
      req.user.userId,
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    await deleteOrganization(String(req.params.id), req.user.userId);

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationBusinessesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const businesses = await getOrganizationBusinesses(
      String(req.params.id),
      req.user.userId,
    );

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
export async function addBusinessToOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const business = await addBusinessToOrganization(
      String(req.params.organizationId),
      String(req.params.businessId),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Business added to organization successfully",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function transferBusinessToOrganizationController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const business = await transferBusinessToOrganization(
      String(req.params.businessId),
      String(req.params.organizationId),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Business transferred to organization successfully",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}
