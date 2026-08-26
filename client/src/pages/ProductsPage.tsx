import { useEffect, useMemo, useState } from 'react';

import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import api from '../services/api';
import type { DiscoveryProduct } from '../services/discoveryService';

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface PublicProduct extends DiscoveryProduct {
  averageRating?: number;
  reviewCount?: number;
  category?: ProductCategory | null;
}

interface ProductsResponse {
  success: boolean;
  data: {
    products: PublicProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc';

function ProductsPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError('');

        const response = await api.get<ProductsResponse>('/products', {
          params: {
            page,
            limit: 12,
            search: search.trim() || undefined,
            sort,
          },
        });

        if (!mounted) {
          return;
        }

        setProducts(response.data.data.products);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalProducts(response.data.data.pagination.total);
      } catch {
        if (mounted) {
          setError('Unable to load products right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [page, search, sort, retryKey]);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const pageNumbers = useMemo(() => {
    const numbers: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let value = start; value <= end; value += 1) {
      numbers.push(value);
    }

    return numbers;
  }, [page, totalPages]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-10">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-blue-200/30 blur-3xl" />

        <div className="absolute -right-32 top-[30rem] h-96 w-96 animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute left-1/3 top-[55rem] h-80 w-80 animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-sky-200/20 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <Container>
        <div className="relative">
          {/* Hero */}
          <section className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-12 text-white shadow-2xl shadow-blue-200/40 sm:px-10 sm:py-14 lg:px-14">
            {/* Animated decorative shapes */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-[spin_18s_linear_infinite] rounded-full border border-white/10" />

            <div className="pointer-events-none absolute -right-8 top-10 h-40 w-40 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-white/10 blur-2xl" />

            <div className="pointer-events-none absolute bottom-[-5rem] left-1/2 h-48 w-48 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Denvia Online Market
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover what you
                <span className="block text-blue-100">
                  need, all in one place.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Explore products from businesses across the Denvia
                marketplace. Search, compare prices, discover great deals and
                find something you love.
              </p>

              {/* Search */}
              <div className="mt-8 max-w-3xl">
                <label htmlFor="product-search" className="sr-only">
                  Search products
                </label>

                <div className="flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center">
                    <span className="pl-3 text-xl text-gray-400">⌕</span>

                    <input
                      id="product-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search products, categories..."
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Hero stats */}
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-sm font-semibold">
                    {totalProducts.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-sm text-blue-100">
                    products
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-sm font-semibold">Easy</span>
                  <span className="ml-1.5 text-sm text-blue-100">
                    discovery
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-sm font-semibold">Local</span>
                  <span className="ml-1.5 text-sm text-blue-100">
                    businesses
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="mt-8">
            <div className="flex flex-col gap-5 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />

                  <h2 className="text-xl font-bold text-gray-900">
                    {search ? 'Search results' : 'Explore products'}
                  </h2>
                </div>

                {!loading && (
                  <p className="mt-1.5 pl-5 text-sm text-gray-500">
                    {totalProducts.toLocaleString()}{' '}
                    {totalProducts === 1 ? 'product' : 'products'} available
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="product-sort"
                  className="text-sm font-semibold text-gray-600"
                >
                  Sort by
                </label>

                <select
                  id="product-sort"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_asc">Price: Low to high</option>
                  <option value="price_desc">Price: High to low</option>
                  <option value="name_asc">Name: A–Z</option>
                  <option value="name_desc">Name: Z–A</option>
                </select>
              </div>
            </div>
          </section>

          {/* Loading */}
          {loading && (
            <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden rounded-3xl border-gray-100 p-0 shadow-sm"
                >
                  <div className="relative h-56 animate-pulse overflow-hidden bg-gray-200">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
                  </div>
                </Card>
              ))}
            </section>
          )}

          {/* Error */}
          {!loading && error && (
            <Card className="mt-8 overflow-hidden rounded-3xl border-red-100 bg-white">
              <div className="relative px-6 py-14 text-center">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-400 via-red-600 to-orange-500" />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
                  !
                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900">
                  Products could not be loaded
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <Card className="mt-8 overflow-hidden rounded-3xl border-gray-100 bg-white">
              <div className="relative px-6 py-16 text-center">
                <div className="absolute left-1/2 top-0 h-1 w-32 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />

                <div className="mx-auto flex h-20 w-20 animate-[pulse_4s_ease-in-out_infinite] items-center justify-center rounded-3xl bg-blue-50 text-3xl shadow-inner">
                  🛍
                </div>

                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  No products found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                  {search
                    ? `We couldn't find any products matching "${search}". Try another search term.`
                    : 'There are no public products available yet.'}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Products */}
          {!loading && !error && products.length > 0 && (
            <>
              <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => {
                  const primaryMedia =
                    product.media?.find(
                      (media) =>
                        typeof media === 'object' &&
                        media !== null &&
                        'isPrimary' in media &&
                        Boolean(media.isPrimary),
                    ) ?? product.media?.[0];

                  const imageUrl =
                    typeof primaryMedia === 'object' &&
                    primaryMedia !== null &&
                    'url' in primaryMedia &&
                    typeof primaryMedia.url === 'string'
                      ? primaryMedia.url
                      : null;

                  const hasDiscount =
                    typeof product.compareAtPrice === 'number' &&
                    product.compareAtPrice > product.price;

                  const discountPercentage = hasDiscount
                    ? Math.round(
                        ((product.compareAtPrice! - product.price) /
                          product.compareAtPrice!) *
                          100,
                      )
                    : 0;

                  const isOutOfStock =
                    typeof product.stockQuantity === 'number' &&
                    product.stockQuantity <= 0;

                  return (
                    <Card
                      key={product._id}
                      className="group relative overflow-hidden rounded-3xl border-gray-100 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-100/50"
                    >
                      {/* Product image */}
                      <div className="relative h-60 overflow-hidden bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading={index < 4 ? 'eager' : 'lazy'}
                            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
                            <span className="text-5xl opacity-70 transition duration-500 group-hover:scale-110">
                              🛍
                            </span>
                          </div>
                        )}

                        {/* Image overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                        {hasDiscount && (
                          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                            -{discountPercentage}%
                          </span>
                        )}

                        {isOutOfStock && (
                          <span className="absolute right-3 top-3 rounded-full bg-gray-950/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                            Out of stock
                          </span>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="p-5">
                        {product.category && (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            {product.category.name}
                          </span>
                        )}

                        <h3 className="mt-3 line-clamp-2 min-h-[3.5rem] text-base font-bold leading-6 text-gray-900 transition group-hover:text-blue-700">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xl font-bold tracking-tight text-gray-950">
                              {product.currency}{' '}
                              {product.price.toLocaleString()}
                            </p>

                            {hasDiscount && (
                              <p className="mt-0.5 text-sm text-gray-400 line-through">
                                {product.currency}{' '}
                                {product.compareAtPrice!.toLocaleString()}
                              </p>
                            )}
                          </div>

                          {typeof product.averageRating === 'number' &&
                            product.reviewCount !== undefined && (
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-sm text-amber-500">
                                    ★
                                  </span>

                                  <span className="text-sm font-bold text-gray-900">
                                    {product.averageRating.toFixed(1)}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-500">
                                  {product.reviewCount}{' '}
                                  {product.reviewCount === 1
                                    ? 'review'
                                    : 'reviews'}
                                </p>
                              </div>
                            )}
                        </div>

                        {typeof product.stockQuantity === 'number' && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <p
                              className={`text-xs font-semibold ${
                                isOutOfStock
                                  ? 'text-red-600'
                                  : product.stockQuantity <= 5
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Currently unavailable'
                                : product.stockQuantity <= 5
                                  ? `Only ${product.stockQuantity} left`
                                  : '✓ In stock'}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </section>

              {/* Pagination */}
              {totalPages > 1 && (
                <section className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                          pageNumber === page
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    Next →
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

export default ProductsPage;