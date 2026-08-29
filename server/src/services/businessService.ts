import mongoose from "mongoose";
import Product from "../models/Product.js";
import Business from "../models/Business.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";
import { generateSlug } from "../utils/slug.js";
import type {
  CreateBusinessInput,
  PublicBusinessQueryInput,
} from "../types/business.js";
import type { PublicProductQueryInput } from "../types/product.js";

export async function createBusiness(
  ownerId: string,
  input: CreateBusinessInput,
) {
  const slug = generateSlug(input.name);

  const existingBusiness = await Business.findOne({
    slug,
  });

  if (existingBusiness) {
    throw new AppError("A business with this name already exists", 409);
  }

  const business = await Business.create({
    ownerId,
    slug,
    name: input.name,
    description: input.description,
    email: input.email,
    phone: input.phone,
    whatsappNumber: input.whatsappNumber,
    category: input.category,
    location: input.location,
    operatingHours: input.operatingHours,
    socialLinks: input.socialLinks,
    logo: input.logo,
    coverImage: input.coverImage,
    website: input.website,
  });

  const user = await User.findById(ownerId).select("+activeBusinessId");

  if (!user) {
    await Business.findByIdAndDelete(business._id);
    throw new AppError("User account not found", 404);
  }

  if (!user.activeBusinessId) {
    user.activeBusinessId = business._id;
    await user.save();
  }

  return business;
}

export async function getMyBusinesses(ownerId: string) {
  return Business.find({ ownerId }).sort({
    createdAt: -1,
  });
}

export async function selectBusiness(businessId: string, ownerId: string) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to select it",
      404,
    );
  }

  const user = await User.findById(ownerId);

  if (!user) {
    throw new AppError("User account not found", 404);
  }

  user.activeBusinessId = business._id;
  await user.save();

  return business;
}

export async function getBusinessById(businessId: string, ownerId: string) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to access it",
      404,
    );
  }

  return business;
}

export async function updateBusiness(
  businessId: string,
  ownerId: string,
  input: Partial<CreateBusinessInput>,
) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to modify it",
      404,
    );
  }

  if (input.name && input.name !== business.name) {
    const newSlug = generateSlug(input.name);

    const existingBusiness = await Business.findOne({
      slug: newSlug,
      _id: { $ne: businessId },
    });

    if (existingBusiness) {
      throw new AppError("A business with this name already exists", 409);
    }

    business.name = input.name;
    business.slug = newSlug;
  }

  if (input.description !== undefined) {
    business.description = input.description;
  }

  if (input.email !== undefined) {
    business.email = input.email;
  }

  if (input.phone !== undefined) {
    business.phone = input.phone;
  }

  if (input.whatsappNumber !== undefined) {
    business.whatsappNumber = input.whatsappNumber;
  }

  if (input.category !== undefined) {
    business.category = input.category;
  }

  if (input.location !== undefined) {
    business.location = input.location;
  }

  if (input.website !== undefined) {
    business.website = input.website;
  }

  if (input.operatingHours !== undefined) {
    business.operatingHours = {
      ...business.operatingHours,
      ...input.operatingHours,
    } as typeof business.operatingHours;
  }

  if (input.socialLinks !== undefined) {
    business.socialLinks = input.socialLinks;
  }

  if (input.logo !== undefined) {
    business.logo = input.logo;
  }

  if (input.coverImage !== undefined) {
    business.coverImage = input.coverImage;
  }

  await business.save();

  return business;
}

export async function deleteBusiness(businessId: string, ownerId: string) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    ownerId,
  });

  if (!business) {
    throw new AppError(
      "Business not found or you do not have permission to delete it",
      404,
    );
  }

  const user = await User.findById(ownerId).select("+activeBusinessId");

  if (!user) {
    throw new AppError("User account not found", 404);
  }

  const wasActiveBusiness = user.activeBusinessId?.toString() === businessId;

  await Business.findByIdAndDelete(businessId);

  if (wasActiveBusiness) {
    const replacementBusiness = await Business.findOne({
      ownerId,
      _id: { $ne: businessId },
    }).sort({
      createdAt: -1,
    });

    if (replacementBusiness) {
      user.activeBusinessId = replacementBusiness._id;
      await user.save();
    } else {
      await User.updateOne(
        { _id: ownerId },
        { $unset: { activeBusinessId: 1 } },
      );
    }
  }

  return true;
}

export async function getPublicBusinesses(query: PublicBusinessQueryInput) {
  const { page, limit, search, category, sort } = query;

  const filter: Record<string, unknown> = {
    status: "active",
  };

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    filter.category = {
      $regex: `^${category}$`,
      $options: "i",
    };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  } as const;

  const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .select(
        "_id name slug description email phone category location logo coverImage website status createdAt updatedAt",
      )
      .sort(sortMap[sort])
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

export async function getPublicBusinessById(businessId: string) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "active",
  }).select(
    "_id name slug description email phone category location logo coverImage website status createdAt updatedAt",
  );

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  return business;
}

export async function getPublicBusinessProducts(
  businessId: string,
  query: PublicProductQueryInput,
) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "active",
  });

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  const { page, limit, search, categoryId, sort } = query;

  const filter: Record<string, unknown> = {
    businessId,
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
    filter.categoryId = categoryId;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  } as const;

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate({
        path: "categoryId",
        select: "name slug description",
      })
      .sort(sortMap[sort])
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getBusinessWhatsAppLink(
  businessId: string,
  message?: string,
) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "active",
  }).select("name phone whatsappNumber");

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  const whatsappNumber = business.whatsappNumber || business.phone;

  if (!whatsappNumber) {
    throw new AppError("This business does not have a WhatsApp number", 400);
  }

  const phone = whatsappNumber.replace(/\D/g, "");

  if (!phone) {
    throw new AppError("This business does not have a valid phone number", 400);
  }

  const whatsappUrl = new URL(`https://wa.me/${phone}`);

  if (message?.trim()) {
    whatsappUrl.searchParams.set("text", message.trim());
  }

  return {
    businessId: business._id,
    businessName: business.name,
    phone: whatsappNumber,
    whatsappUrl: whatsappUrl.toString(),
  };
}
