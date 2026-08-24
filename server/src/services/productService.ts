import cloudinary from "../config/cloudinary.js";
import Product, { type IProduct } from "../models/Product.js";
import Business from "../models/Business.js";
import Category from "../models/Category.js";
import { AppError } from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";
import { generateSlug } from "../utils/slug.js";
import type {
  CreateProductInput,
  PublicProductQueryInput,
  UpdateProductInput,
} from "../types/product.js";
import { Types } from "mongoose";

function normalizeProductMedia(
  media: NonNullable<CreateProductInput["media"]>,
) {
  if (media.length === 0) {
    return media;
  }

  const primaryIndex = media.findIndex((image) => image.isPrimary);

  return media.map((image, index) => ({
    ...image,
    isPrimary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
    sortOrder: index,
  }));
}

function normalizeProductStatus(
  stockQuantity: number,
  requestedStatus: IProduct["status"],
) {
  if (stockQuantity === 0) {
    return "out_of_stock" as const;
  }

  if (requestedStatus === "out_of_stock") {
    return "active" as const;
  }

  return requestedStatus;
}

function validateObjectId(value: string, fieldName: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
}

async function verifyBusinessOwnership(businessId: string, ownerId: string) {
  validateObjectId(businessId, "business ID");

  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to manage it",
      403,
    );
  }

  return business;
}

async function verifyCategoryOwnership(categoryId: string, businessId: string) {
  validateObjectId(categoryId, "category ID");
  validateObjectId(businessId, "business ID");

  const category = await Category.findOne({
    _id: categoryId,
    businessId,
    isActive: true,
  });

  if (!category) {
    throw new AppError(
      "Category not found, inactive, or does not belong to this business",
      400,
    );
  }

  return category;
}

async function deleteProductMediaFromCloudinary(media: IProduct["media"]) {
  for (const item of media) {
    if (!item.publicId) {
      continue;
    }

    try {
      await cloudinary.uploader.destroy(item.publicId, {
        resource_type: "image",
      });
    } catch (error) {
      console.error(
        `Failed to delete Cloudinary asset ${item.publicId}:`,
        error,
      );
    }
  }
}

export async function createProduct(
  ownerId: string,
  input: CreateProductInput,
) {
  await verifyBusinessOwnership(input.businessId, ownerId);

  const slug = generateSlug(input.name);

  const existingSlug = await Product.findOne({
    businessId: input.businessId,
    slug,
  });

  if (existingSlug) {
    throw new AppError(
      "A product with this name already exists in this business",
      409,
    );
  }

  if (input.sku) {
    const existingSku = await Product.findOne({
      businessId: input.businessId,
      sku: input.sku,
    });

    if (existingSku) {
      throw new AppError("A product with this SKU already exists", 409);
    }
  }

  if (
    input.compareAtPrice !== undefined &&
    input.compareAtPrice <= input.price
  ) {
    throw new AppError(
      "Compare-at price must be greater than the selling price",
      400,
    );
  }

  const media = normalizeProductMedia(input.media ?? []);

  if (input.categoryId) {
    await verifyCategoryOwnership(input.categoryId, input.businessId);
  }

  const status = normalizeProductStatus(input.stockQuantity, input.status);

  const product = await Product.create({
    businessId: input.businessId,
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    currency: input.currency,
    sku: input.sku,
    stockQuantity: input.stockQuantity,
    categoryId: input.categoryId,
    status,
    isVisible: input.isVisible,
    media,
  });

  return product;
}

export async function getMyProducts(ownerId: string, businessId: string) {
  await verifyBusinessOwnership(businessId, ownerId);

  return Product.find({
    businessId,
  })
    .populate({
      path: "categoryId",
      select: "name slug description",
    })
    .sort({
      createdAt: -1,
    });
}

export async function getPublicProducts(query: PublicProductQueryInput) {
  const { page, limit, search, categoryId, sort } = query;

  const filter: Record<string, unknown> = {
    status: "active",
    isVisible: true,
  };

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (categoryId) {
    validateObjectId(categoryId, "category ID");

    filter.categoryId = new Types.ObjectId(categoryId);
  }

  const sortMap = {
    newest: {
      createdAt: -1,
    },
    oldest: {
      createdAt: 1,
    },
    price_asc: {
      price: 1,
    },
    price_desc: {
      price: -1,
    },
    name_asc: {
      name: 1,
    },
    name_desc: {
      name: -1,
    },
  } as const;

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort])
      .skip(skip)
      .limit(safeLimit)
      .populate({
        path: "categoryId",
        select: "name slug description",
      }),

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

export async function getProductById(ownerId: string, productId: string) {
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  return product;
}

export async function updateProduct(
  ownerId: string,
  productId: string,
  input: UpdateProductInput,
) {
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  if (input.name && input.name !== product.name) {
    const newSlug = generateSlug(input.name);

    const existingProduct = await Product.findOne({
      businessId: product.businessId,
      slug: newSlug,
      _id: {
        $ne: productId,
      },
    });

    if (existingProduct) {
      throw new AppError(
        "A product with this name already exists in this business",
        409,
      );
    }

    product.name = input.name;
    product.slug = newSlug;
  }

  if (input.description !== undefined) {
    product.description = input.description;
  }

  if (input.price !== undefined) {
    product.price = input.price;
  }

  if (input.compareAtPrice !== undefined) {
    product.compareAtPrice = input.compareAtPrice;
  }

  if (input.currency !== undefined) {
    product.currency = input.currency;
  }

  if (input.sku !== undefined) {
    const existingSku = await Product.findOne({
      businessId: product.businessId,
      sku: input.sku,
      _id: {
        $ne: productId,
      },
    });

    if (existingSku) {
      throw new AppError("A product with this SKU already exists", 409);
    }

    product.sku = input.sku;
  }

  if (input.stockQuantity !== undefined) {
    product.stockQuantity = input.stockQuantity;
  }

  if (input.categoryId !== undefined) {
    await verifyCategoryOwnership(
      input.categoryId,
      product.businessId.toString(),
    );

    product.categoryId = new Types.ObjectId(input.categoryId);
  }

  if (input.status !== undefined) {
    product.status = input.status;
  }

  if (input.isVisible !== undefined) {
    product.isVisible = input.isVisible;
  }

  if (input.media !== undefined) {
    product.media = normalizeProductMedia(input.media);
  }

  if (
    product.compareAtPrice !== undefined &&
    product.compareAtPrice <= product.price
  ) {
    throw new AppError(
      "Compare-at price must be greater than the selling price",
      400,
    );
  }

  product.status = normalizeProductStatus(
    product.stockQuantity,
    product.status,
  );

  await product.save();

  return product;
}

export async function addProductMedia(
  ownerId: string,
  productId: string,
  mediaInput: {
    url: string;
    publicId: string;
    alt?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  },
) {
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  if (product.media.length >= 10) {
    throw new AppError("A product can have a maximum of 10 images", 400);
  }

  const shouldBePrimary =
    product.media.length === 0 || mediaInput.isPrimary === true;

  if (shouldBePrimary) {
    product.media.forEach((media) => {
      media.isPrimary = false;
    });
  }

  product.media.push({
    url: mediaInput.url,
    publicId: mediaInput.publicId,
    alt: mediaInput.alt,
    isPrimary: shouldBePrimary,
    sortOrder: product.media.length,
  });

  await product.save();

  return product;
}

export async function setPrimaryProductMedia(
  ownerId: string,
  productId: string,
  mediaId: string,
) {
  validateObjectId(productId, "product ID");

  validateObjectId(mediaId, "media ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  const media = product.media.find((item) => item._id?.toString() === mediaId);

  if (!media) {
    throw new AppError("Product media not found", 404);
  }

  product.media.forEach((item) => {
    item.isPrimary = false;
  });

  media.isPrimary = true;

  await product.save();

  return product;
}

export async function deleteProductMedia(
  ownerId: string,
  productId: string,
  mediaId: string,
) {
  validateObjectId(productId, "product ID");

  validateObjectId(mediaId, "media ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  const mediaIndex = product.media.findIndex(
    (item) => item._id?.toString() === mediaId,
  );

  if (mediaIndex === -1) {
    throw new AppError("Product media not found", 404);
  }

  const media = product.media[mediaIndex];

  const wasPrimary = media.isPrimary;

  const publicId = media.publicId;

  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
    } catch (error) {
      console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    }
  }

  product.media.splice(mediaIndex, 1);

  product.media.forEach((item, index) => {
    item.sortOrder = index;
  });

  if (wasPrimary && product.media.length > 0) {
    product.media.forEach((item) => {
      item.isPrimary = false;
    });

    product.media[0].isPrimary = true;
  }

  await product.save();

  return product;
}

export async function reorderProductMedia(
  ownerId: string,
  productId: string,
  mediaIds: string[],
) {
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  const uniqueMediaIds = new Set(mediaIds);

  if (uniqueMediaIds.size !== mediaIds.length) {
    throw new AppError("Duplicate media IDs are not allowed", 400);
  }

  if (mediaIds.length !== product.media.length) {
    throw new AppError(
      "All product media IDs must be provided when reordering",
      400,
    );
  }

  const productMediaIds = new Set(
    product.media.map((media) => media._id?.toString()),
  );

  const containsInvalidMedia = mediaIds.some(
    (mediaId) => !productMediaIds.has(mediaId),
  );

  if (containsInvalidMedia) {
    throw new AppError(
      "One or more media IDs do not belong to this product",
      400,
    );
  }

  const mediaMap = new Map(
    product.media.map((media) => [media._id?.toString(), media]),
  );

  mediaIds.forEach((mediaId, index) => {
    const media = mediaMap.get(mediaId);

    if (media) {
      media.sortOrder = index;
    }
  });

  product.media.sort((a, b) => a.sortOrder - b.sortOrder);

  await product.save();

  return product;
}

export async function deleteProduct(ownerId: string, productId: string) {
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await verifyBusinessOwnership(product.businessId.toString(), ownerId);

  await deleteProductMediaFromCloudinary(product.media);

  await Product.findByIdAndDelete(productId);

  return true;
}

export async function getPublicProductById(productId: string) {
  validateObjectId(productId, "product ID");

  const product = await Product.findOne({
    _id: productId,
    status: "active",
    isVisible: true,
  }).populate({
    path: "categoryId",
    select: "name slug description",
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}
