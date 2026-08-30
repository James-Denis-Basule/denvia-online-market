import Service from "../models/Service.js";
import Business from "../models/Business.js";
import { AppError } from "../utils/AppError.js";
import { generateSlug } from "../utils/slug.js";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "../types/service.js";

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

export async function createService(
  ownerId: string,
  input: CreateServiceInput,
) {
  await verifyBusinessOwnership(
    input.businessId,
    ownerId,
  );

  const slug = generateSlug(input.name);

  const existingService = await Service.findOne({
    businessId: input.businessId,
    slug,
  });

  if (existingService) {
    throw new AppError(
      "A service with this name already exists in this business",
      409,
    );
  }

  const service = await Service.create({
    businessId: input.businessId,
    name: input.name,
    slug,
    description: input.description,
    category: input.category,
    price: input.price,
    currency: input.currency,
    pricingType: input.pricingType,
    duration: input.duration,
    status: input.status,
    isVisible: input.isVisible,
  });

  return service;
}

export async function getMyServices(
  ownerId: string,
  businessId: string,
) {
  await verifyBusinessOwnership(
    businessId,
    ownerId,
  );

  return Service.find({
    businessId,
    isDeleted: false,
  }).sort({
    name: 1,
  });
}

export async function getServiceById(
  ownerId: string,
  serviceId: string,
) {
  const service = await Service.findById(
    serviceId,
  );

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    service.businessId.toString(),
    ownerId,
  );

  return service;
}

export async function getPublicServices(
  businessId: string,
) {
  const business = await Business.findOne({
    _id: businessId,
    status: "active",
  });

  if (!business) {
    throw new AppError(
      "Business not found",
      404,
    );
  }

  return Service.find({
    businessId,
    status: "active",
    isVisible: true,
    isDeleted: false,
  }).sort({
    name: 1,
  });
}

export async function updateService(
  ownerId: string,
  serviceId: string,
  input: UpdateServiceInput,
) {
  const service = await Service.findById(
    serviceId,
  );

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    service.businessId.toString(),
    ownerId,
  );

  if (
    input.name &&
    input.name !== service.name
  ) {
    const newSlug = generateSlug(input.name);

    const existingService =
      await Service.findOne({
        businessId: service.businessId,
        slug: newSlug,
        _id: {
          $ne: serviceId,
        },
      });

    if (existingService) {
      throw new AppError(
        "A service with this name already exists in this business",
        409,
      );
    }

    service.name = input.name;
    service.slug = newSlug;
  }

  if (input.description !== undefined) {
    service.description =
      input.description;
  }

  if (input.category !== undefined) {
    service.category =
      input.category;
  }

  if (input.price !== undefined) {
    service.price = input.price;
  }

  if (input.currency !== undefined) {
    service.currency =
      input.currency;
  }

  if (input.pricingType !== undefined) {
    service.pricingType =
      input.pricingType;
  }

  if (input.duration !== undefined) {
    service.duration =
      input.duration;
  }

  if (input.status !== undefined) {
    service.status =
      input.status;
  }

  if (input.isVisible !== undefined) {
    service.isVisible =
      input.isVisible;
  }

  await service.save();

  return service;
}

export async function deleteService(
  ownerId: string,
  serviceId: string,
) {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  await verifyBusinessOwnership(
    service.businessId.toString(),
    ownerId,
  );

  if (service.isDeleted) {
    throw new AppError("Service is already in the bin", 400);
  }

  service.isDeleted = true;
  service.deletedAt = new Date();

  await service.save();

  return service;
}

export async function permanentlyDeleteExpiredServices() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() - 30);

  const result = await Service.deleteMany({
    isDeleted: true,
    deletedAt: {
      $lte: expiry,
    },
  });

  return result.deletedCount;
}

export async function getDeletedServices(
  ownerId: string,
  businessId: string,
) {
  await verifyBusinessOwnership(
    businessId,
    ownerId,
  );

  await permanentlyDeleteExpiredServices();

  return Service.find({
    businessId,
    isDeleted: true,
  }).sort({
    deletedAt: -1,
  });
}

export async function restoreService(
  ownerId: string,
  serviceId: string,
) {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
    );
  }

  await verifyBusinessOwnership(
    service.businessId.toString(),
    ownerId,
  );

  if (!service.isDeleted) {
    throw new AppError(
      "Service is not in the bin",
      400,
    );
  }

  service.isDeleted = false;
  service.deletedAt = undefined;

  await service.save();

  return service;
}
