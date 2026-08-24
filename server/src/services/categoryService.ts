import Category from "../models/Category.js";
import Business from "../models/Business.js";
import { AppError } from "../utils/AppError.js";
import { generateSlug } from "../utils/slug.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types/category.js";

async function verifyBusinessOwnership(
  businessId: string,
  ownerId: string,
) {
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

export async function createCategory(
  ownerId: string,
  input: CreateCategoryInput,
) {
  await verifyBusinessOwnership(
    input.businessId,
    ownerId,
  );

  const slug = generateSlug(input.name);

  const existingCategory = await Category.findOne({
    businessId: input.businessId,
    slug,
  });

  if (existingCategory) {
    throw new AppError(
      "A category with this name already exists in this business",
      409,
    );
  }

  const category = await Category.create({
    businessId: input.businessId,
    name: input.name,
    slug,
    description: input.description,
    isActive: input.isActive,
  });

  return category;
}

export async function getMyCategories(
  ownerId: string,
  businessId: string,
) {
  await verifyBusinessOwnership(
    businessId,
    ownerId,
  );

  return Category.find({
    businessId,
  }).sort({
    name: 1,
  });
}

export async function getCategoryById(
  ownerId: string,
  categoryId: string,
) {
  const category = await Category.findById(
    categoryId,
  );

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    category.businessId.toString(),
    ownerId,
  );

  return category;
}

export async function updateCategory(
  ownerId: string,
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const category = await Category.findById(
    categoryId,
  );

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    category.businessId.toString(),
    ownerId,
  );

  if (
    input.name &&
    input.name !== category.name
  ) {
    const newSlug = generateSlug(
      input.name,
    );

    const existingCategory =
      await Category.findOne({
        businessId: category.businessId,
        slug: newSlug,
        _id: {
          $ne: categoryId,
        },
      });

    if (existingCategory) {
      throw new AppError(
        "A category with this name already exists in this business",
        409,
      );
    }

    category.name = input.name;
    category.slug = newSlug;
  }

  if (input.description !== undefined) {
    category.description =
      input.description;
  }

  if (input.isActive !== undefined) {
    category.isActive =
      input.isActive;
  }

  await category.save();

  return category;
}

export async function deleteCategory(
  ownerId: string,
  categoryId: string,
) {
  const category = await Category.findById(
    categoryId,
  );

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    category.businessId.toString(),
    ownerId,
  );

  await Category.findByIdAndDelete(
    categoryId,
  );

  return true;
}

export async function getPublicCategories(
  businessId?: string,
) {
  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (businessId) {
    filter.businessId = businessId;
  }

  return Category.find(filter).sort({
    name: 1,
  });
}

export async function getPublicCategoryById(
  categoryId: string,
) {
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  return category;
}