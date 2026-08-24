import Business from "../models/Business.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Category from "../models/Category.js";
import Post from "../models/Post.js";

export interface DiscoveryLimitOptions {
  businessLimit?: number;
  productLimit?: number;
  serviceLimit?: number;
  postLimit?: number;
  categoryLimit?: number;
}

/**
 * Public businesses.
 *
 * Only active businesses are exposed through discovery.
 */
export const getNewBusinesses = async (limit = 10) => {
  return Business.find({
    status: "active",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "_id name slug description category location logo coverImage website createdAt",
    )
    .lean();
};

/**
 * Phase 1 featured businesses.
 *
 * There is currently no explicit `isFeatured` field or
 * engagement-ranking system in the Business model.
 *
 * Therefore, Phase 1 uses recently created active businesses
 * as the featured fallback.
 *
 * This can later be replaced with an administrator-controlled
 * featured flag or ranking algorithm.
 */
export const getFeaturedBusinesses = async (limit = 10) => {
  return Business.find({
    status: "active",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "_id name slug description category location logo coverImage website createdAt",
    )
    .lean();
};

/**
 * Phase 1 trending businesses.
 *
 * True trending requires analytics such as views, clicks,
 * inquiries or engagement scores, which are not yet present.
 *
 * For Phase 1, recently active businesses are used as the
 * temporary discovery ranking.
 */
export const getTrendingBusinesses = async (limit = 10) => {
  return Business.find({
    status: "active",
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select(
      "_id name slug description category location logo coverImage website createdAt updatedAt",
    )
    .lean();
};

/**
 * Public products.
 *
 * A product is discoverable only when:
 * - its business is active
 * - the product is active
 * - the product is visible
 */
export const getNewProducts = async (limit = 10) => {
  return Product.aggregate([
    {
      $match: {
        status: "active",
        isVisible: true,
      },
    },

    {
      $lookup: {
        from: "businesses",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },

    {
      $unwind: "$business",
    },

    {
      $match: {
        "business.status": "active",
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $limit: limit,
    },

    {
      $project: {
        _id: 1,
        businessId: 1,
        name: 1,
        slug: 1,
        description: 1,
        price: 1,
        compareAtPrice: 1,
        currency: 1,
        stockQuantity: 1,
        categoryId: 1,
        status: 1,
        isVisible: 1,
        media: 1,
        createdAt: 1,

        business: {
          _id: "$business._id",
          name: "$business.name",
          slug: "$business.slug",
          logo: "$business.logo",
        },
      },
    },
  ]);
};

/**
 * Phase 1 trending products.
 *
 * Since analytics are not yet available, updated products are
 * used as the temporary ranking signal.
 */
export const getTrendingProducts = async (limit = 10) => {
  return Product.aggregate([
    {
      $match: {
        status: "active",
        isVisible: true,
      },
    },

    {
      $lookup: {
        from: "businesses",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },

    {
      $unwind: "$business",
    },

    {
      $match: {
        "business.status": "active",
      },
    },

    {
      $sort: {
        updatedAt: -1,
      },
    },

    {
      $limit: limit,
    },

    {
      $project: {
        _id: 1,
        businessId: 1,
        name: 1,
        slug: 1,
        description: 1,
        price: 1,
        compareAtPrice: 1,
        currency: 1,
        stockQuantity: 1,
        categoryId: 1,
        status: 1,
        isVisible: 1,
        media: 1,
        createdAt: 1,
        updatedAt: 1,

        business: {
          _id: "$business._id",
          name: "$business.name",
          slug: "$business.slug",
          logo: "$business.logo",
        },
      },
    },
  ]);
};

/**
 * Public services.
 *
 * Included because the SRS states that customers should be
 * able to discover services.
 */
export const getNewServices = async (limit = 10) => {
  return Service.aggregate([
    {
      $match: {
        status: "active",
        isVisible: true,
      },
    },

    {
      $lookup: {
        from: "businesses",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },

    {
      $unwind: "$business",
    },

    {
      $match: {
        "business.status": "active",
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $limit: limit,
    },

    {
      $project: {
        _id: 1,
        businessId: 1,
        name: 1,
        slug: 1,
        description: 1,
        category: 1,
        price: 1,
        currency: 1,
        pricingType: 1,
        duration: 1,
        status: 1,
        isVisible: 1,
        createdAt: 1,

        business: {
          _id: "$business._id",
          name: "$business.name",
          slug: "$business.slug",
          logo: "$business.logo",
        },
      },
    },
  ]);
};

/**
 * Public categories.
 *
 * Categories are currently business-specific.
 * Discovery therefore returns active categories belonging
 * to active businesses.
 */
export const getCategories = async (limit = 20) => {
  return Category.aggregate([
    {
      $match: {
        isActive: true,
      },
    },

    {
      $lookup: {
        from: "businesses",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },

    {
      $unwind: "$business",
    },

    {
      $match: {
        "business.status": "active",
      },
    },

    {
      $sort: {
        name: 1,
      },
    },

    {
      $limit: limit,
    },

    {
      $project: {
        _id: 1,
        businessId: 1,
        name: 1,
        slug: 1,
        description: 1,
        isActive: 1,
      },
    },
  ]);
};

/**
 * Public promotions.
 *
 * Phase 1 promotions are derived from:
 *
 * 1. Products with compareAtPrice greater than price
 * 2. Published special_offer posts
 * 3. Published product_promotion posts
 */
export const getPromotions = async (limit = 10) => {
  const [discountedProducts, promotionPosts] = await Promise.all([
    Product.aggregate([
      {
        $match: {
          status: "active",
          isVisible: true,
          $expr: {
            $and: [
              {
                $gt: ["$compareAtPrice", "$price"],
              },
              {
                $gt: ["$compareAtPrice", 0],
              },
            ],
          },
        },
      },

      {
        $lookup: {
          from: "businesses",
          localField: "businessId",
          foreignField: "_id",
          as: "business",
        },
      },

      {
        $unwind: "$business",
      },

      {
        $match: {
          "business.status": "active",
        },
      },

      {
        $sort: {
          updatedAt: -1,
        },
      },

      {
        $limit: limit,
      },

      {
        $project: {
          _id: 1,
          type: {
            $literal: "product_discount",
          },
          name: 1,
          slug: 1,
          description: 1,
          price: 1,
          compareAtPrice: 1,
          currency: 1,
          media: 1,
          businessId: 1,

          business: {
            _id: "$business._id",
            name: "$business.name",
            slug: "$business.slug",
            logo: "$business.logo",
          },
        },
      },
    ]),

    Post.aggregate([
      {
        $match: {
          status: "published",
          isVisible: true,
          type: {
            $in: ["special_offer", "product_promotion"],
          },
        },
      },

      {
        $lookup: {
          from: "businesses",
          localField: "businessId",
          foreignField: "_id",
          as: "business",
        },
      },

      {
        $unwind: "$business",
      },

      {
        $match: {
          "business.status": "active",
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $limit: limit,
      },

      {
        $project: {
          _id: 1,
          type: 1,
          title: 1,
          content: 1,
          hashtags: 1,
          media: 1,
          productId: 1,
          eventDate: 1,
          businessId: 1,
          createdAt: 1,

          business: {
            _id: "$business._id",
            name: "$business.name",
            slug: "$business.slug",
            logo: "$business.logo",
          },
        },
      },
    ]),
  ]);

  return {
    products: discountedProducts,
    posts: promotionPosts,
  };
};

/**
 * Complete public discovery homepage.
 */
export const getDiscoveryHome = async (
  options: DiscoveryLimitOptions = {},
) => {
  const {
    businessLimit = 10,
    productLimit = 10,
    serviceLimit = 10,
    postLimit = 10,
    categoryLimit = 20,
  } = options;

  const [
    featuredBusinesses,
    trendingBusinesses,
    newBusinesses,
    trendingProducts,
    newProducts,
    newServices,
    promotions,
    categories,
  ] = await Promise.all([
    getFeaturedBusinesses(businessLimit),
    getTrendingBusinesses(businessLimit),
    getNewBusinesses(businessLimit),
    getTrendingProducts(productLimit),
    getNewProducts(productLimit),
    getNewServices(serviceLimit),
    getPromotions(postLimit),
    getCategories(categoryLimit),
  ]);

  return {
    featuredBusinesses,
    trendingBusinesses,
    newBusinesses,
    trendingProducts,
    newProducts,
    newServices,
    promotions,
    categories,
  };
};