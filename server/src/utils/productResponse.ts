import type { IProduct } from "../models/Product.js";

type PublicCategory = {
  _id: {
    toString(): string;
  };
  name: string;
  slug: string;
  description?: string;
};

export function toPublicProduct(product: IProduct) {
  const category = product.categoryId as unknown as PublicCategory | undefined;

  return {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    averageRating: Number(product.averageRating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    status: product.status,
    isVisible: product.isVisible,

    category: category
      ? {
          _id: String(category._id),
          name: category.name,
          slug: category.slug,
          description: category.description,
        }
      : null,

    categoryId: category?._id ? String(category._id) : undefined,

    media: product.media.map((media) => ({
      _id: media._id?.toString(),
      url: media.url,
      alt: media.alt,
      isPrimary: media.isPrimary,
      sortOrder: media.sortOrder,
    })),

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
