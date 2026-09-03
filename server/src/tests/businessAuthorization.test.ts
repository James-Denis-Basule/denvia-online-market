import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../app.js";
import Business from "../models/Business.js";
import BusinessStaff from "../models/BusinessStaff.js";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";

function authorizationFor(user: {
  _id: mongoose.Types.ObjectId;
  role: string;
}) {
  return `Bearer ${generateAccessToken({ userId: String(user._id), role: user.role })}`;
}

test("business role activation and staff-level authorization", async () => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  await mongoose.connect(mongo.getUri(), {
    readPreference: "primary",
  });

  await mongo.waitUntilRunning();

  await mongoose.connect(mongo.getUri());

  const server = app.listen(0);

  try {
    const [
      plainCustomer,
      existingOwner,
      staffCandidate,
      outsider,
      adminUser,
    ] = await Promise.all([
      User.create({
        firstName: "Plain",
        lastName: "Customer",
        email: "plain-customer@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Existing",
        lastName: "Owner",
        email: "existing-owner@example.com",
        password: "secret123",
        role: "business_owner",
      }),
      User.create({
        firstName: "Staff",
        lastName: "Candidate",
        email: "staff-candidate@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Random",
        lastName: "Outsider",
        email: "outsider@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin-user@example.com",
        password: "secret123",
        role: "admin",
      }),
    ]);

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const request = (path: string, options: RequestInit = {}) =>
      fetch(`http://127.0.0.1:${port}${path}`, options);

    const jsonRequest = (
      method: string,
      token: string,
      body?: Record<string, unknown>,
    ) => ({
      method,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // --- Feature 6: customer -> business role activation ---

    const createBusinessResponse = await request(
      "/api/businesses",
      jsonRequest("POST", authorizationFor(plainCustomer), {
        name: "Plain Customer Shop",
        email: "plain-customer-shop@example.com",
      }),
    );

    assert.equal(createBusinessResponse.status, 201);

    const createdBusinessPayload = await createBusinessResponse.json();
    const newBusinessId = createdBusinessPayload.data.business._id;

    const upgradedUser = await User.findById(plainCustomer._id);

    assert.equal(
      upgradedUser?.role,
      "business_owner",
      "creating a business should activate business_owner on the SAME account",
    );

    // Creating a second business as an already-elevated owner should not
    // change or downgrade their role.
    const secondBusinessResponse = await request(
      "/api/businesses",
      jsonRequest("POST", authorizationFor(existingOwner), {
        name: "Existing Owner Second Shop",
        email: "existing-owner-second-shop@example.com",
      }),
    );

    assert.equal(secondBusinessResponse.status, 201);

    const stillOwner = await User.findById(existingOwner._id);
    assert.equal(stillOwner?.role, "business_owner");

    // --- Feature 7: business-level access enforcement ---

    // Re-issue a token for the now-upgraded user to exercise owner-level
    // staff management on the business they just created.
    const ownerToken = authorizationFor({
      _id: plainCustomer._id,
      role: "business_owner",
    });

    // An unrelated authenticated user cannot manage someone else's staff.
    const outsiderInvite = await request(
      `/api/businesses/${newBusinessId}/staff`,
      jsonRequest("POST", authorizationFor(outsider), {
        email: staffCandidate.email,
      }),
    );

    assert.equal(outsiderInvite.status, 403);

    // An unauthenticated request is rejected outright.
    const unauthenticatedInvite = await request(
      `/api/businesses/${newBusinessId}/staff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staffCandidate.email }),
      },
    );

    assert.equal(unauthenticatedInvite.status, 401);

    // The owner can invite a staff member.
    const ownerInvite = await request(
      `/api/businesses/${newBusinessId}/staff`,
      jsonRequest("POST", ownerToken, {
        email: staffCandidate.email,
        role: "staff",
      }),
    );

    assert.equal(ownerInvite.status, 201);

    const invitedUser = await User.findById(staffCandidate._id);

    assert.equal(
      invitedUser?.role,
      "business_staff",
      "inviting a plain user as staff should activate business_staff on the SAME account",
    );

    const membershipAfterInvite = await BusinessStaff.findOne({
      businessId: newBusinessId,
      userId: staffCandidate._id,
    });

    assert.equal(membershipAfterInvite?.status, "invited");

    // Before accepting, the invited staff member has no business access yet.
    const staffListBeforeAccept = await request(
      `/api/businesses/${newBusinessId}/staff`,
      {
        headers: {
          Authorization: authorizationFor({
            _id: staffCandidate._id,
            role: "business_staff",
          }),
        },
      },
    );

    assert.equal(staffListBeforeAccept.status, 403);

    // Staff member accepts their invite.
    const acceptResponse = await request(
      `/api/businesses/${newBusinessId}/staff/accept`,
      jsonRequest(
        "POST",
        authorizationFor({ _id: staffCandidate._id, role: "business_staff" }),
      ),
    );

    assert.equal(acceptResponse.status, 200);

    const membershipAfterAccept = await BusinessStaff.findOne({
      businessId: newBusinessId,
      userId: staffCandidate._id,
    });

    assert.equal(membershipAfterAccept?.status, "active");

    // A plain "staff" role (not manager, not owner) cannot manage other
    // staff, even once active.
    const staffTriesToListRoster = await request(
      `/api/businesses/${newBusinessId}/staff`,
      {
        headers: {
          Authorization: authorizationFor({
            _id: staffCandidate._id,
            role: "business_staff",
          }),
        },
      },
    );

    assert.equal(staffTriesToListRoster.status, 403);

    // The owner can list the roster.
    const ownerListsRoster = await request(
      `/api/businesses/${newBusinessId}/staff`,
      {
        headers: { Authorization: ownerToken },
      },
    );

    assert.equal(ownerListsRoster.status, 200);

    const rosterPayload = await ownerListsRoster.json();
    assert.equal(rosterPayload.data.staff.length, 1);

    // Platform admins can manage staff on ANY business, without being
    // the owner or a staff member themselves.
    const adminListsRoster = await request(
      `/api/businesses/${newBusinessId}/staff`,
      {
        headers: { Authorization: authorizationFor(adminUser) },
      },
    );

    assert.equal(adminListsRoster.status, 200);

    // The owner removes the staff member.
    const membershipId = String(membershipAfterAccept?._id);

    const removeResponse = await request(
      `/api/businesses/${newBusinessId}/staff/${membershipId}`,
      jsonRequest("DELETE", ownerToken),
    );

    assert.equal(removeResponse.status, 200);

    const membershipAfterRemoval = await BusinessStaff.findById(membershipId);
    assert.equal(membershipAfterRemoval?.status, "removed");

    // Sanity check: the business really was created with the right owner.
    const persistedBusiness = await Business.findById(newBusinessId);
    assert.equal(String(persistedBusiness?.ownerId), String(plainCustomer._id));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    await mongoose.disconnect();
    await mongo.stop();
  }
});