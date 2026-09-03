import mongoose from "mongoose";

import Business from "../models/Business.js";
import BusinessStaff from "../models/BusinessStaff.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

import type { BusinessStaffRole } from "../models/BusinessStaff.js";

/**
 * Invites an existing platform user to join a business as staff.
 * The invited user's account is NOT created or modified here — they
 * must already exist (identified by email). Their global role is
 * elevated to "business_staff" once the invite is created, matching
 * Feature 6/7: no second account, capability activates on the
 * existing account.
 */
export async function inviteStaffMember(
  businessId: string,
  invitedByUserId: string,
  input: { email: string; role?: BusinessStaffRole },
) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const business = await Business.findById(businessId);

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  const invitedUser = await User.findOne({
    email: input.email.toLowerCase().trim(),
  });

  if (!invitedUser) {
    throw new AppError(
      "No account found with that email address",
      404,
    );
  }

  if (invitedUser.id === business.ownerId.toString()) {
    throw new AppError(
      "The business owner is already the primary account for this business",
      409,
    );
  }

  const existingMembership = await BusinessStaff.findOne({
    businessId,
    userId: invitedUser.id,
  });

  if (existingMembership && existingMembership.status !== "removed") {
    throw new AppError(
      "This user already has a membership on this business",
      409,
    );
  }

  const membership = existingMembership
    ? existingMembership
    : new BusinessStaff({
        businessId,
        userId: invitedUser.id,
        invitedBy: invitedByUserId,
      });

  membership.role = input.role ?? "staff";
  membership.status = "invited";
  membership.invitedBy = new mongoose.Types.ObjectId(invitedByUserId);

  await membership.save();

  // Elevate the invited user's platform role so they can access
  // business-context UI/routes, unless they already outrank staff
  // (business_owner or admin keep their existing role).
  if (invitedUser.role === "user") {
    invitedUser.role = "business_staff";
    await invitedUser.save();
  }

  return membership;
}

export async function listBusinessStaff(businessId: string) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  return BusinessStaff.find({
    businessId,
    status: { $ne: "removed" },
  })
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 });
}

export async function removeStaffMember(
  businessId: string,
  membershipId: string,
) {
  if (
    !mongoose.isValidObjectId(businessId) ||
    !mongoose.isValidObjectId(membershipId)
  ) {
    throw new AppError("Invalid ID", 400);
  }

  const membership = await BusinessStaff.findOne({
    _id: membershipId,
    businessId,
  });

  if (!membership) {
    throw new AppError("Staff membership not found", 404);
  }

  membership.status = "removed";
  await membership.save();

  return true;
}

/**
 * A staff member accepts their invite, moving status from
 * "invited" to "active". Until accepted, an invited membership does
 * NOT grant access via requireBusinessAccess.
 */
export async function acceptStaffInvite(
  businessId: string,
  userId: string,
) {
  if (!mongoose.isValidObjectId(businessId)) {
    throw new AppError("Invalid business ID", 400);
  }

  const membership = await BusinessStaff.findOne({
    businessId,
    userId,
    status: "invited",
  });

  if (!membership) {
    throw new AppError("No pending invite found for this business", 404);
  }

  membership.status = "active";
  await membership.save();

  return membership;
}