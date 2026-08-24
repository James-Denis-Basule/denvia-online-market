import type { Request, Response } from "express";

import {
  getCategories,
  getDiscoveryHome,
  getFeaturedBusinesses,
  getNewBusinesses,
  getNewProducts,
  getNewServices,
  getPromotions,
  getTrendingBusinesses,
  getTrendingProducts,
} from "../services/discoveryService.js";

const parseLimit = (
  value: unknown,
  defaultValue = 10,
  max = 50,
) => {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return Math.min(parsed, max);
};

export const discoveryHome = async (
  req: Request,
  res: Response,
) => {
  try {
    const businessLimit = parseLimit(
      req.query.businessLimit,
      10,
    );

    const productLimit = parseLimit(
      req.query.productLimit,
      10,
    );

    const serviceLimit = parseLimit(
      req.query.serviceLimit,
      10,
    );

    const postLimit = parseLimit(
      req.query.postLimit,
      10,
    );

    const categoryLimit = parseLimit(
      req.query.categoryLimit,
      20,
      50,
    );

    const discovery = await getDiscoveryHome({
      businessLimit,
      productLimit,
      serviceLimit,
      postLimit,
      categoryLimit,
    });

    return res.status(200).json({
      success: true,
      data: discovery,
    });
  } catch (error) {
    console.error(
      "Discovery home error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load discovery data",
    });
  }
};

export const featuredBusinesses = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const businesses =
      await getFeaturedBusinesses(limit);

    return res.status(200).json({
      success: true,
      data: {
        businesses,
      },
    });
  } catch (error) {
    console.error(
      "Featured businesses error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load featured businesses",
    });
  }
};

export const trendingBusinesses = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const businesses =
      await getTrendingBusinesses(limit);

    return res.status(200).json({
      success: true,
      data: {
        businesses,
      },
    });
  } catch (error) {
    console.error(
      "Trending businesses error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load trending businesses",
    });
  }
};

export const newBusinesses = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const businesses =
      await getNewBusinesses(limit);

    return res.status(200).json({
      success: true,
      data: {
        businesses,
      },
    });
  } catch (error) {
    console.error(
      "New businesses error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load new businesses",
    });
  }
};

export const trendingProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const products =
      await getTrendingProducts(limit);

    return res.status(200).json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error(
      "Trending products error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load trending products",
    });
  }
};

export const newProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const products =
      await getNewProducts(limit);

    return res.status(200).json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error(
      "New products error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load new products",
    });
  }
};

export const newServices = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const services =
      await getNewServices(limit);

    return res.status(200).json({
      success: true,
      data: {
        services,
      },
    });
  } catch (error) {
    console.error(
      "New services error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load new services",
    });
  }
};

export const promotions = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(req.query.limit);

    const promotionData =
      await getPromotions(limit);

    return res.status(200).json({
      success: true,
      data: promotionData,
    });
  } catch (error) {
    console.error(
      "Promotions error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load promotions",
    });
  }
};

export const categories = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = parseLimit(
      req.query.limit,
      20,
      50,
    );

    const categoryData =
      await getCategories(limit);

    return res.status(200).json({
      success: true,
      data: {
        categories: categoryData,
      },
    });
  } catch (error) {
    console.error(
      "Discovery categories error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load discovery categories",
    });
  }
};