import Business from "../models/Business.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Category from "../models/Category.js";

import type { SortOrder } from "mongoose";
import { getPagination } from "../utils/pagination.js";
import type { SearchQueryInput } from "../types/search.js";

export async function searchMarketplace(input: SearchQueryInput) {
  const {
    q,
    category,
    location,
    minPrice,
    maxPrice,
    sort,
    order,
    page,
    limit,
  } = input;

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const searchRegex = new RegExp(q, "i");

  /*
   * Sort configuration
   *
   * MongoDB uses:
   *  1  = ascending
   * -1  = descending
   */
  const sortDirection: SortOrder = order === "asc" ? 1 : -1;

  const productSortMap = {
    price: { price: sortDirection },
    name: { name: sortDirection },
    createdAt: { createdAt: sortDirection },
  };

  const serviceSortMap = {
    price: { price: sortDirection },
    name: { name: sortDirection },
    createdAt: { createdAt: sortDirection },
  };

  const businessSortMap = {
    name: { name: sortDirection },
    createdAt: { createdAt: sortDirection },
  };

  const categorySortMap = {
    name: { name: sortDirection },
    createdAt: { createdAt: sortDirection },
  };

  /*
   * Resolve category name/slug to category IDs.
   *
   * Products use categoryId.
   * Businesses and services use category strings.
   */
  let categoryIds: string[] = [];

  if (category) {
    const categoryRegex = new RegExp(category, "i");

    const matchingCategories = await Category.find({
      isActive: true,
      $or: [{ name: categoryRegex }, { slug: categoryRegex }],
    })
      .select("_id")
      .lean();

    categoryIds = matchingCategories.map((item) => item._id.toString());
  }

  /*
   * Resolve location to business IDs.
   *
   * Products and services belong to businesses
   * through businessId.
   */
  let locationBusinessIds: string[] | null = null;

  if (location) {
    const locationRegex = new RegExp(location, "i");

    const matchingBusinesses = await Business.find({
      status: "active",
      $or: [
        {
          "location.country": locationRegex,
        },
        {
          "location.city": locationRegex,
        },
        {
          "location.address": locationRegex,
        },
      ],
    })
      .select("_id")
      .lean();

    locationBusinessIds = matchingBusinesses.map((business) =>
      business._id.toString(),
    );
  }

  /*
   * Product search
   */
  const productFilter: any = {
    status: "active",
    isVisible: true,
    $or: [{ name: searchRegex }, { description: searchRegex }],
  };

  if (category) {
    productFilter.categoryId = {
      $in: categoryIds,
    };
  }

  if (location) {
    productFilter.businessId = {
      $in: locationBusinessIds,
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    productFilter.price = {};

    if (minPrice !== undefined) {
      productFilter.price.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      productFilter.price.$lte = maxPrice;
    }
  }

  /*
   * Service search
   */
  const serviceFilter: any = {
    status: "active",
    isVisible: true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ],
  };

  if (category) {
    serviceFilter.category = new RegExp(category, "i");
  }

  if (location) {
    serviceFilter.businessId = {
      $in: locationBusinessIds,
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    serviceFilter.price = {};

    if (minPrice !== undefined) {
      serviceFilter.price.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      serviceFilter.price.$lte = maxPrice;
    }
  }

  /*
   * Category search
   */
  const categoryFilter: any = {
    isActive: true,
    $or: [{ name: searchRegex }, { description: searchRegex }],
  };

  /*
   * First find products/services.
   *
   * We need their businessIds so that a business
   * can also be returned when one of its products
   * or services matches the search.
   */
  const [matchingProductsForBusinesses, matchingServicesForBusinesses] =
    await Promise.all([
      Product.find(productFilter).select("businessId").lean(),

      Service.find(serviceFilter).select("businessId").lean(),
    ]);

  /*
   * Collect business IDs from matching products
   * and services.
   */
  const relatedBusinessIds = [
    ...matchingProductsForBusinesses.map((product) =>
      product.businessId.toString(),
    ),

    ...matchingServicesForBusinesses.map((service) =>
      service.businessId.toString(),
    ),
  ];

  /*
   * Remove duplicate business IDs.
   */
  const uniqueRelatedBusinessIds = [...new Set(relatedBusinessIds)];

  /*
   * Business search
   *
   * A business can match:
   *
   * 1. Directly by name
   * 2. Directly by description
   * 3. Directly by category
   * 4. Indirectly through a matching product
   * 5. Indirectly through a matching service
   */
  const businessFilter: any = {
    status: "active",
    $or: [
      {
        name: searchRegex,
      },
      {
        description: searchRegex,
      },
      {
        category: searchRegex,
      },
    ],
  };

  /*
   * Include businesses belonging to matching
   * products/services.
   */
  if (uniqueRelatedBusinessIds.length > 0) {
    businessFilter.$or.push({
      _id: {
        $in: uniqueRelatedBusinessIds,
      },
    });
  }

  /*
   * Category restriction for businesses.
   */
  if (category) {
    businessFilter.$and = [
      {
        category: new RegExp(category, "i"),
      },
    ];
  }

  /*
   * Location restriction for businesses.
   */
  if (location) {
    const locationRegex = new RegExp(location, "i");

    businessFilter.$and = businessFilter.$and || [];

    businessFilter.$and.push({
      $or: [
        {
          "location.country": locationRegex,
        },
        {
          "location.city": locationRegex,
        },
        {
          "location.address": locationRegex,
        },
      ],
    });
  }

  /*
   * Execute searches in parallel.
   *
   * Products and services support:
   * - price
   * - name
   * - createdAt
   *
   * Businesses and categories support:
   * - name
   * - createdAt
   *
   * If sort=price is requested, businesses/categories
   * fall back to name sorting because they have no
   * price field.
   */
  const businessSort =
    sort === "price"
      ? { name: sortDirection }
      : businessSortMap[sort as "name" | "createdAt"];

  const categorySort =
    sort === "price"
      ? { name: sortDirection }
      : categorySortMap[sort as "name" | "createdAt"];

  const [businesses, products, services, categories] = await Promise.all([
    Business.find(businessFilter)
      .sort(businessSort)
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Product.find(productFilter)
      .sort(productSortMap[sort])
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Service.find(serviceFilter)
      .sort(serviceSortMap[sort])
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Category.find(categoryFilter)
      .sort(categorySort)
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    businesses,
    products,
    services,
    categories,

    pagination: {
      page: safePage,
      limit: safeLimit,
    },
  };
}
