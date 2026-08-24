import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from '../utils/AppError.js';

import {
  createCategory,
  getMyCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getPublicCategoryById,
  getPublicCategories,
} from '../services/categoryService.js';

import {
  createCategorySchema,
  updateCategorySchema,
} from '../types/category.js';

import type {
  AuthenticatedRequest,
} from '../middleware/authMiddleware.js';

export async function createCategoryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    const validation =
      createCategorySchema.safeParse(
        req.body,
      );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message:
          'Invalid category information',
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
      return;
    }

    const category =
      await createCategory(
        req.user.userId,
        validation.data,
      );

    res.status(201).json({
      success: true,
      message:
        'Category created successfully',
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyCategoriesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    const categories =
      await getMyCategories(
        req.user.userId,
        req.params.businessId as string,
      );

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    const category =
      await getCategoryById(
        req.user.userId,
        req.params.id as string,
      );

    res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    const validation =
      updateCategorySchema.safeParse(
        req.body,
      );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message:
          'Invalid category information',
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
      return;
    }

    const category =
      await updateCategory(
        req.user.userId,
        req.params.id as string,
        validation.data,
      );

    res.status(200).json({
      success: true,
      message:
        'Category updated successfully',
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    await deleteCategory(
      req.user.userId,
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      message:
        'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId =
      typeof req.query.businessId === "string"
        ? req.query.businessId
        : undefined;

    const categories = await getPublicCategories(businessId);

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const category = await getPublicCategoryById(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
}