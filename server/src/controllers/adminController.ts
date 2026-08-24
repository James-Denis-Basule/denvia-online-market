import type { Request, Response, NextFunction } from "express";

import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  deleteUser,
  getAdminBusinesses,
  getAdminBusiness,
  updateBusinessStatus,
  getAdminProducts,
  moderateProduct,
  getAdminCategories,
  deleteAdminCategory,
  getAdminPosts,
  deleteAdminPost,
} from "../services/adminService.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

function paginationParams(req: Request) {
  const page = Math.max(
    1,
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(String(req.query.limit ?? "20"), 10) || 20,
    ),
  );

  return { page, limit };
}

export async function getDashboardController(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const dashboard = await getAdminDashboard();

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsersController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationParams(req);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const result = await getAdminUsers(
      page,
      limit,
      search,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatusController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const isActive = req.body?.isActive;

    if (typeof isActive !== "boolean") {
      res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
      return;
    }

    const user = await updateUserStatus(
      req.params.id,
      isActive,
    );

    res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User suspended successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationParams(req);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const result = await getAdminBusinesses(
      page,
      limit,
      search,
      status,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const business = await getAdminBusiness(
      req.params.id,
    );

    res.status(200).json({
      success: true,
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessStatusController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const status = req.body?.status;

    if (
      !["active", "suspended", "pending"].includes(status)
    ) {
      res.status(400).json({
        success: false,
        message:
          "status must be active, suspended, or pending",
      });
      return;
    }

    const business = await updateBusinessStatus(
      req.params.id,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Business status updated successfully",
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationParams(req);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const result = await getAdminProducts(
      page,
      limit,
      search,
      status,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function moderateProductController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const isVisible = req.body?.isVisible;

    if (typeof isVisible !== "boolean") {
      res.status(400).json({
        success: false,
        message: "isVisible must be a boolean",
      });
      return;
    }

    const product = await moderateProduct(
      req.params.id,
      isVisible,
    );

    res.status(200).json({
      success: true,
      message: "Product moderation updated successfully",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoriesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationParams(req);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const result = await getAdminCategories(
      page,
      limit,
      search,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteAdminCategory(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = paginationParams(req);

    const result = await getAdminPosts(
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

export async function deletePostController(
  req: Request<{ id: string }> & AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteAdminPost(req.params.id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}