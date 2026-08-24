#!/bin/bash

set -e

BASE_URL="http://localhost:5500"
ADMIN_EMAIL="admin-test@example.com"
ADMIN_PASSWORD="AdminTest@2026"

echo "======================================"
echo "       ADMIN MODULE TEST SUITE"
echo "======================================"
echo

echo "===== 1. BUILD ====="
npm run build
echo "BUILD: PASS"
echo

echo "===== 2. CREATE/ENSURE ADMIN ====="

node --import tsx - <<'NODE'
import mongoose from "mongoose";
import dotenv from "dotenv";
import * as UserModule from "./src/models/User.ts";
const User = UserModule.default.default ?? UserModule.default;
import { hashPassword } from "./src/utils/password.ts";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined in .env");
}

const email = "admin-test@example.com";
const password = "AdminTest@2026";

await mongoose.connect(mongoUri);

let user = await User.findOne({ email });

if (!user) {
  const hashedPassword = await hashPassword(password);

  user = await User.create({
    firstName: "Admin",
    lastName: "Test",
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
    isEmailVerified: true,
  });

  console.log("Admin account created");
} else {
  user.role = "admin";
  user.isActive = true;
  user.isEmailVerified = true;
  user.password = await hashPassword(password);
  await user.save();

  console.log("Admin account already existed; credentials refreshed");
}

console.log(`Admin ID: ${user._id}`);

await mongoose.disconnect();
NODE

echo

echo "===== 3. ADMIN LOGIN ====="

ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-test@example.com",
    "password": "AdminTest@2026"
  }')

echo "$ADMIN_RESPONSE"

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | python3 -c '
import sys,json
data=json.load(sys.stdin)
print(data["data"]["accessToken"])
')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ADMIN LOGIN: FAIL"
  exit 1
fi

echo "ADMIN LOGIN: PASS"
echo

echo "===== 4. ADMIN DASHBOARD ====="

curl -s -o /tmp/admin-dashboard.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-dashboard.json
echo

echo "===== 5. ADMIN USERS ====="

curl -s -o /tmp/admin-users.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-users.json
echo

echo "===== 6. ADMIN BUSINESSES ====="

curl -s -o /tmp/admin-businesses.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/businesses?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-businesses.json
echo

echo "===== 7. ADMIN BUSINESS SEARCH ====="

curl -s -o /tmp/admin-business-search.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/businesses?search=DOM" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-business-search.json
echo

echo "===== 8. ADMIN PRODUCTS ====="

curl -s -o /tmp/admin-products.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/products?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-products.json
echo

echo "===== 9. ADMIN CATEGORIES ====="

curl -s -o /tmp/admin-categories.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/categories?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-categories.json
echo

echo "===== 10. ADMIN POSTS ====="

curl -s -o /tmp/admin-posts.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/posts?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

cat /tmp/admin-posts.json
echo

echo "===== 11. NON-ADMIN AUTHORIZATION ====="

USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "domtest@example.com",
    "password": "DomTest@2026"
  }')

USER_TOKEN=$(echo "$USER_RESPONSE" | python3 -c '
import sys,json
data=json.load(sys.stdin)
print(data["data"]["accessToken"])
')

curl -s -o /tmp/admin-forbidden.json \
  -w "HTTP %{http_code}\n" \
  "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $USER_TOKEN"

cat /tmp/admin-forbidden.json
echo

echo "======================================"
echo "       ADMIN TEST SUITE COMPLETE"
echo "======================================"
