import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import Business from "../models/Business.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../types/organization.js";

export async function createOrganization(
  ownerId: string,
  input: CreateOrganizationInput,
) {
  const existing = await Organization.findOne({
    ownerId,
    name: input.name,
  });

  if (existing) {
    throw new AppError("You already have an organization with this name", 409);
  }

  return Organization.create({
    ownerId,
    name: input.name,
    description: input.description,
  });
}

export async function getMyOrganizations(ownerId: string) {
  return Organization.find({ ownerId }).sort({ createdAt: -1 });
}

export async function getOrganizationById(
  organizationId: string,
  ownerId: string,
) {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw new AppError("Invalid organization ID", 400);
  }

  const organization = await Organization.findOne({
    _id: organizationId,
    ownerId,
  });

  if (!organization) {
    throw new AppError(
      "Organization not found or you do not have permission to access it",
      404,
    );
  }

  return organization;
}

export async function updateOrganization(
  organizationId: string,
  ownerId: string,
  input: UpdateOrganizationInput,
) {
  const organization = await getOrganizationById(organizationId, ownerId);

  if (input.name !== undefined) {
    organization.name = input.name;
  }

  if (input.description !== undefined) {
    organization.description = input.description;
  }

  await organization.save();

  return organization;
}

export async function deleteOrganization(
  organizationId: string,
  ownerId: string,
) {
  const organization = await getOrganizationById(organizationId, ownerId);

  const businesses = await Business.countDocuments({
    organizationId: organization._id,
  });

  if (businesses > 0) {
    throw new AppError(
      "Remove or transfer all businesses before deleting this organization",
      409,
    );
  }

  await organization.deleteOne();

  return true;
}

export async function getOrganizationBusinesses(
  organizationId: string,
  ownerId: string,
) {
  const organization = await getOrganizationById(organizationId, ownerId);

  return Business.find({
    organizationId: organization._id,
    ownerId,
  }).sort({ createdAt: -1 });
}

export async function addBusinessToOrganization(
  organizationId: string,
  businessId: string,
  ownerId: string,
) {
  if (
    !mongoose.isValidObjectId(organizationId) ||
    !mongoose.isValidObjectId(businessId)
  ) {
    throw new AppError("Invalid organization or business ID", 400);
  }

  const organization = await Organization.findOne({
    _id: organizationId,
    ownerId,
  });

  if (!organization) {
    throw new AppError(
      "Organization not found or you do not have permission to use it",
      404,
    );
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

  business.organizationId = organization._id;
  await business.save();

  return business;
}

export async function transferBusinessToOrganization(
  businessId: string,
  organizationId: string,
  ownerId: string,
) {
  return addBusinessToOrganization(
    organizationId,
    businessId,
    ownerId,
  );
}

export async function removeBusinessFromOrganization(
  businessId: string,
  ownerId: string,
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

  business.organizationId = undefined;
  await business.save();

  return business;
}