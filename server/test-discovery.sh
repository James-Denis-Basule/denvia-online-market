#!/bin/zsh

BASE_URL="http://localhost:5500/api/discovery"

echo ""
echo "=================================================="
echo "          DISCOVERY API TESTS — PHASE 1"
echo "=================================================="

echo ""
echo "0. DISCOVERY HOME"
curl -s "$BASE_URL" | jq

echo ""
echo "1. FEATURED BUSINESSES"
curl -s "$BASE_URL/businesses/featured" | jq

echo ""
echo "2. FEATURED BUSINESSES — LIMIT 5"
curl -s "$BASE_URL/businesses/featured?limit=5" | jq

echo ""
echo "3. TRENDING BUSINESSES"
curl -s "$BASE_URL/businesses/trending" | jq

echo ""
echo "4. TRENDING BUSINESSES — LIMIT 5"
curl -s "$BASE_URL/businesses/trending?limit=5" | jq

echo ""
echo "5. NEW BUSINESSES"
curl -s "$BASE_URL/businesses/new" | jq

echo ""
echo "6. NEW BUSINESSES — LIMIT 5"
curl -s "$BASE_URL/businesses/new?limit=5" | jq

echo ""
echo "7. TRENDING PRODUCTS"
curl -s "$BASE_URL/products/trending" | jq

echo ""
echo "8. TRENDING PRODUCTS — LIMIT 5"
curl -s "$BASE_URL/products/trending?limit=5" | jq

echo ""
echo "9. NEW PRODUCTS"
curl -s "$BASE_URL/products/new" | jq

echo ""
echo "10. NEW PRODUCTS — LIMIT 5"
curl -s "$BASE_URL/products/new?limit=5" | jq

echo ""
echo "11. NEW SERVICES"
curl -s "$BASE_URL/services/new" | jq

echo ""
echo "12. NEW SERVICES — LIMIT 5"
curl -s "$BASE_URL/services/new?limit=5" | jq

echo ""
echo "13. PROMOTIONS"
curl -s "$BASE_URL/promotions" | jq

echo ""
echo "14. PROMOTIONS — LIMIT 5"
curl -s "$BASE_URL/promotions?limit=5" | jq

echo ""
echo "15. CATEGORIES"
curl -s "$BASE_URL/categories" | jq

echo ""
echo "16. CATEGORIES — LIMIT 20"
curl -s "$BASE_URL/categories?limit=20" | jq

echo ""
echo "17. DISCOVERY HOME — CUSTOM LIMITS"
curl -s "$BASE_URL?businessLimit=5&productLimit=5&serviceLimit=5&postLimit=5&categoryLimit=10" | jq

echo ""
echo "18. DISCOVERY — LIMIT 1"
curl -s "$BASE_URL/businesses/new?limit=1" | jq

echo ""
echo "19. DISCOVERY — LIMIT ABOVE MAX"
curl -s "$BASE_URL/businesses/new?limit=100" | jq

echo ""
echo "20. DISCOVERY — INVALID LIMIT"
curl -s "$BASE_URL/businesses/new?limit=abc" | jq

echo ""
echo "21. DISCOVERY — ZERO LIMIT"
curl -s "$BASE_URL/businesses/new?limit=0" | jq

echo ""
echo "22. DISCOVERY — NEGATIVE LIMIT"
curl -s "$BASE_URL/businesses/new?limit=-1" | jq

echo ""
echo "23. DISCOVERY — DECIMAL LIMIT"
curl -s "$BASE_URL/businesses/new?limit=2.5" | jq

echo ""
echo "24. PRODUCT VISIBILITY CHECK"
curl -s "$BASE_URL/products/new" | jq

echo ""
echo "25. SERVICE VISIBILITY CHECK"
curl -s "$BASE_URL/services/new" | jq

echo ""
echo "26. CATEGORY ACTIVITY CHECK"
curl -s "$BASE_URL/categories" | jq

echo ""
echo "27. PROMOTION VISIBILITY CHECK"
curl -s "$BASE_URL/promotions" | jq

echo ""
echo "28. DISCOVERY RESPONSE STRUCTURE"
curl -s "$BASE_URL" | jq '{
  success,
  sections: {
    featuredBusinesses: (.data.featuredBusinesses | type),
    trendingBusinesses: (.data.trendingBusinesses | type),
    newBusinesses: (.data.newBusinesses | type),
    trendingProducts: (.data.trendingProducts | type),
    newProducts: (.data.newProducts | type),
    newServices: (.data.newServices | type),
    promotions: (.data.promotions | type),
    categories: (.data.categories | type)
  }
}'

echo ""
echo "29. DISCOVERY COUNT SUMMARY"
curl -s "$BASE_URL" | jq '{
  featuredBusinesses: (.data.featuredBusinesses | length),
  trendingBusinesses: (.data.trendingBusinesses | length),
  newBusinesses: (.data.newBusinesses | length),
  trendingProducts: (.data.trendingProducts | length),
  newProducts: (.data.newProducts | length),
  newServices: (.data.newServices | length),
  promotionProducts: (.data.promotions.products | length),
  promotionPosts: (.data.promotions.posts | length),
  categories: (.data.categories | length)
}'

echo ""
echo "=================================================="
echo "       DISCOVERY API TESTS COMPLETE"
echo "=================================================="
