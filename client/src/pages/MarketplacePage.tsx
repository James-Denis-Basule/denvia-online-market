import { useEffect, useMemo, useState } from "react";
import Container from "../components/layout/Container";
import Card from "../components/ui/Card";
import api from "../services/api";
import { addToCart } from "../services/commerceService";

type MarketplaceType = "all" | "products" | "services";

interface Product {
  _id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stockQuantity?: number;
  media?: unknown[];
  categoryId?:
    | {
        _id: string;
        name: string;
        slug: string;
      }
    | string;
  business?: {
    _id: string;
    name: string;
    logo?: string;
  };
}

interface Service {
  _id: string;
  businessId: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency: string;
  pricingType?: string;
  business?: {
    _id: string;
    name: string;
    logo?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
  };
}

interface ServicesResponse {
  success: boolean;
  data: {
    services: Service[];
  };
}

interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

function formatPrice(
  price: number | undefined,
  currency = "UGX",
  pricingType?: string,
) {
  if (price === undefined) {
    return pricingType === "free" ? "Free" : "Contact for price";
  }

  const formatted = new Intl.NumberFormat("en-UG").format(price);

  if (pricingType === "starting_from") {
    return `From ${currency} ${formatted}`;
  }

  if (pricingType === "negotiable") {
    return `${currency} ${formatted} · Negotiable`;
  }

  return `${currency} ${formatted}`;
}

function getProductImage(product: Product) {
  if (!Array.isArray(product.media)) {
    return undefined;
  }

  const first = product.media[0];

  if (typeof first === "string") {
    return first;
  }

  if (
    first &&
    typeof first === "object" &&
    "url" in first &&
    typeof first.url === "string"
  ) {
    return first.url;
  }

  return undefined;
}

function MarketplaceCardSkeleton() {
  return (
    <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
      <div className="h-48 animate-pulse bg-slate-200" />

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />

        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />

        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
      </div>
    </Card>
  );
}

function MarketplacePage() {
  const [type, setType] = useState<MarketplaceType>("all");
  const [category, setCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 12;

  useEffect(() => {
    async function loadMarketplace() {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, servicesResponse, categoriesResponse] =
          await Promise.all([
            api.get<ProductsResponse>("/products", {
              params: {
                page: 1,
                limit: 50,
                sort: "newest",
              },
            }),
            api.get<ServicesResponse>("/services/public"),
            api.get<CategoriesResponse>("/categories"),
          ]);

        setProducts(productsResponse.data.data.products ?? []);
        setServices(servicesResponse.data.data.services ?? []);
        setCategories(categoriesResponse.data.data.categories ?? []);
      } catch (err) {
        console.error("Failed to load marketplace", err);
        setError("Unable to load marketplace listings.");
      } finally {
        setLoading(false);
      }
    }

    void loadMarketplace();
  }, []);

  const serviceCategories = useMemo(
    () =>
      [
        ...new Set(
          services
            .map((service) => service.category?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [services],
  );

  const marketplaceCategories = useMemo(() => {
    const productCategories = categories.map((item) => item.name);

    return type === "services"
      ? serviceCategories
      : type === "products"
        ? [...new Set(productCategories)].sort()
        : [...new Set([...productCategories, ...serviceCategories])].sort();
  }, [categories, serviceCategories, type]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const productCategory =
        typeof product.categoryId === "object" ? product.categoryId.name : "";

      const matchesCategory =
        category === "all" || productCategory === category;

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        productCategory.toLowerCase().includes(normalizedSearch) ||
        product.business?.name.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const serviceCategory = service.category ?? "";

      const matchesCategory =
        category === "all" || serviceCategory === category;

      const matchesSearch =
        !normalizedSearch ||
        service.name.toLowerCase().includes(normalizedSearch) ||
        service.description?.toLowerCase().includes(normalizedSearch) ||
        serviceCategory.toLowerCase().includes(normalizedSearch) ||
        service.business?.name.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [services, category, search]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  function changeType(nextType: MarketplaceType) {
    setType(nextType);
    setCategory("all");
    setPage(1);
  }

  const listingCount =
    type === "products"
      ? filteredProducts.length
      : type === "services"
        ? filteredServices.length
        : filteredProducts.length + filteredServices.length;

  const totalPages = Math.max(1, Math.ceil(listingCount / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const displayedProducts =
    type === "products"
      ? filteredProducts.slice(startIndex, endIndex)
      : type === "all"
        ? filteredProducts.slice(
            startIndex,
            Math.min(endIndex, filteredProducts.length),
          )
        : [];

  const displayedServices =
    type === "services"
      ? filteredServices.slice(startIndex, endIndex)
      : type === "all"
        ? filteredServices.slice(
            Math.max(0, startIndex - filteredProducts.length),
            Math.max(0, endIndex - filteredProducts.length),
          )
        : [];

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <Container>
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-slate-500">
            Denvia Online Market
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Marketplace
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Discover products and services from businesses on Denvia.
          </p>
        </section>

        <section className="sticky top-16 z-30 mb-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative grid w-full grid-cols-3 overflow-hidden rounded-xl bg-slate-100 p-1 lg:w-[460px]">
              <div
                className={`pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out ${
                  type === "all"
                    ? "translate-x-0"
                    : type === "products"
                      ? "translate-x-[calc(100%+0.25rem)]"
                      : "translate-x-[calc(200%+0.5rem)]"
                }`}
              />

              {[
                ["all", "All"],
                ["products", "Products"],
                ["services", "Services"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeType(value as MarketplaceType)}
                  className={`relative z-10 w-full whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    type === value
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Categories
                </span>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="all">All</option>

                  {marketplaceCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                aria-label="Toggle search"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition ${
                  searchOpen
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                🔍
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="mt-3">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                <span className="mr-3 text-slate-400">🔍</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products and services..."
                  className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  autoFocus
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="ml-2 text-sm text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <section>
            <div className="mb-5">
              <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <MarketplaceCardSkeleton key={index} />
              ))}
            </div>
          </section>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              Marketplace unavailable
            </h3>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {type === "all"
                    ? "Latest listings"
                    : type === "products"
                      ? "Products"
                      : "Services"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {listingCount} {listingCount === 1 ? "listing" : "listings"}
                </p>
              </div>
            </div>

            {listingCount > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {type !== "services" &&
                    displayedProducts.map((product) => {
                      const image = getProductImage(product);

                      return (
                        <Card
                          key={`product-${product._id}`}
                          className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex h-48 items-center justify-center bg-slate-100">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-center">
                                <div className="mb-2 text-4xl">📦</div>
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                  Product
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                                Product
                              </span>

                              {product.stockQuantity !== undefined && (
                                <span className="text-xs text-slate-400">
                                  {product.stockQuantity > 0
                                    ? `${product.stockQuantity} in stock`
                                    : "Out of stock"}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900">
                              {product.name}
                            </h3>

                            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                              {product.description ||
                                "No description available."}
                            </p>

                            <p className="mt-4 text-lg font-bold text-slate-900">
                              {formatPrice(product.price, product.currency)}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {product.business?.name || "Denvia business"}
                            </p>

                            <button
                              type="button"
                              disabled={
                                product.stockQuantity === 0 ||
                                addingProductId === product._id
                              }
                              onClick={async () => {
                                try {
                                  setAddingProductId(product._id);
                                  setError("");

                                  await addToCart({
                                    productId: product._id,
                                    businessId: product.business?._id ?? "",
                                    name: product.name,
                                    price: product.price,
                                    quantity: 1,
                                    currency: product.currency,
                                  });

                                  setAddedProductId(product._id);

                                  setTimeout(() => {
                                    setAddedProductId((current) =>
                                      current === product._id ? null : current,
                                    );
                                  }, 1800);
                                } catch (err) {
                                  console.error(
                                    "Failed to add product to cart",
                                    err,
                                  );
                                  setError(
                                    "Could not add this product to your cart.",
                                  );
                                } finally {
                                  setAddingProductId(null);
                                }
                              }}
                              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {product.stockQuantity === 0
                                ? "Out of Stock"
                                : addingProductId === product._id
                                  ? "Adding..."
                                  : addedProductId === product._id
                                    ? "Added to Cart ✓"
                                    : "Add to Cart"}
                            </button>
                          </div>
                        </Card>
                      );
                    })}

                  {type !== "products" &&
                    displayedServices.map((service) => (
                      <Card
                        key={`service-${service._id}`}
                        className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex h-48 items-center justify-center bg-slate-100">
                          <div className="text-center">
                            <div className="mb-2 text-4xl">🛠️</div>
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Service
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Service
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-slate-900">
                            {service.name}
                          </h3>

                          <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                            {service.description || "No description available."}
                          </p>

                          <p className="mt-4 text-lg font-bold text-slate-900">
                            {formatPrice(
                              service.price,
                              service.currency,
                              service.pricingType,
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {service.business?.name || "Denvia business"}
                          </p>

                          <button
                            type="button"
                            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            View Service
                          </button>
                        </div>
                      </Card>
                    ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={safePage === 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {pageNumbers.map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition ${
                            pageNumber === safePage
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No listings found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search or category.
                </p>
              </div>
            )}
          </section>
        )}
      </Container>
    </main>
  );
}

export default MarketplacePage;
