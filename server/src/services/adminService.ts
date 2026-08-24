import User from "../models/User.js";
import Business from "../models/Business.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Post from "../models/Post.js";

import { AppError } from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";
import { assertValidObjectId } from "../utils/objectId.js";

export async function getAdminDashboard() {
  const [
    totalUsers,
    activeUsers,
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalProducts,
    activeProducts,
    totalCategories,
    totalPosts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),

    Business.countDocuments(),
    Business.countDocuments({ status: "active" }),
    Business.countDocuments({ status: "suspended" }),

    Product.countDocuments(),
    Product.countDocuments({
      status: "active",
      isVisible: true,
    }),

    Category.countDocuments(),

    Post.countDocuments(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },

    businesses: {
      total: totalBusinesses,
      active: activeBusinesses,
      suspended: suspendedBusinesses,
      pending: await Business.countDocuments({
        status: "pending",
      }),
    },

    products: {
      total: totalProducts,
      active: activeProducts,
    },

    categories: {
      total: totalCategories,
    },

    posts: {
      total: totalPosts,
    },
  };
}

/*
 * USERS
 */

export async function getAdminUsers(
  page: number,
  limit: number,
  search?: string,
) {
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        "_id firstName lastName email phone role isActive isEmailVerified createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    User.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
) {
  assertValidObjectId(userId, "user ID");

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = isActive;

  if (!isActive) {
    user.refreshToken = undefined;
    user.refreshTokenExpiresAt = undefined;
  }

  await user.save();

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

export async function deleteUser(userId: string) {
  assertValidObjectId(userId, "user ID");

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "admin") {
    throw new AppError(
      "Administrator accounts cannot be deleted through this operation",
      403,
    );
  }

  await User.findByIdAndDelete(userId);

  return true;
}

/*
 * BUSINESSES
 */

export async function getAdminBusinesses(
  page: number,
  limit: number,
  search?: string,
  status?: string,
) {
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (
    status &&
    ["active", "suspended", "pending"].includes(status)
  ) {
    filter.status = status;
  }

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .populate(
        "ownerId",
        "firstName lastName email phone",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    Business.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    businesses,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function getAdminBusiness(
  businessId: string,
) {
  assertValidObjectId(businessId, "business ID");

  const business = await Business.findById(businessId)
    .populate(
      "ownerId",
      "firstName lastName email phone role",
    );

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  return business;
}

export async function updateBusinessStatus(
  businessId: string,
  status: "active" | "suspended" | "pending",
) {
  assertValidObjectId(businessId, "business ID");

  const business = await Business.findById(businessId);

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  business.status = status;

  await business.save();

  return business;
}

/*
 * PRODUCTS
 */

export async function getAdminProducts(
  page: number,
  limit: number,
  search?: string,
  status?: string,
) {
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (
    status &&
    ["draft", "active", "out_of_stock", "archived"].includes(
      status,
    )
  ) {
    filter.status = status;
  }

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("businessId", "name slug")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    Product.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    products,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function moderateProduct(
  productId: string,
  isVisible: boolean,
) {
  assertValidObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.isVisible = isVisible;

  if (!isVisible && product.status === "active") {
    product.status = "archived";
  }

  await product.save();

  return product;
}

/*
 * CATEGORIES
 */

export async function getAdminCategories(
  page: number,
  limit: number,
  search?: string,
) {
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("businessId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    Category.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    categories,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function deleteAdminCategory(
  categoryId: string,
) {
  assertValidObjectId(categoryId, "category ID");

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await Category.findByIdAndDelete(categoryId);

  return true;
}

/*
 * POSTS
 */

export async function getAdminPosts(
  page: number,
  limit: number,
) {
  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [posts, total] = await Promise.all([
    Post.find()
      .populate("businessId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    Post.countDocuments(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    posts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function deleteAdminPost(
  postId: string,
) {
  assertValidObjectId(postId, "post ID");

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await Post.findByIdAndDelete(postId);

  return true;
}