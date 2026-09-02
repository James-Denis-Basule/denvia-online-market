import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Container from "../components/layout/Container";
import type { AccountType } from "../services/authService";
import {
  getDiscovery,
  type DiscoveryBusiness,
  type DiscoveryData,
  type DiscoveryProduct,
  type DiscoveryService,
} from "../services/discoveryService";

function HomePage() {
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const requestedAccountType = searchParams.get("type");

  const accountType: AccountType =
    requestedAccountType === "business" ||
    searchParams.get("accountType") === "business"
      ? "business"
      : "customer";

  useEffect(() => {
    let mounted = true;

    async function loadDiscovery() {
      try {
        setLoading(true);
        setError("");

        const response = await getDiscovery();

        if (mounted) {
          setDiscovery(response.data);
        }
      } catch {
        if (mounted) {
          setError("Unable to load marketplace discovery right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDiscovery();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen py-8 sm:py-10">
      <Container>
        {/* Hero */}
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 px-6 py-9 text-white shadow-xl shadow-blue-100 sm:px-10 sm:py-10 lg:px-14">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Denvia Online Market
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              AI-powered business growth
              <span className="block text-blue-100">
                and marketplace platform.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
              Discover businesses, products and services, while giving
              businesses the tools to showcase what they offer and grow their
              presence online.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={`/register?type=${accountType !== "business" && "business"}`}>
                <Button className="w-full bg-blue-600 text-white border-white hover:bg-blue-50 sm:w-auto">
                  Create Business
                </Button>
              </Link>

              <Link to="/businesses">
                <Button
                  variant="outline"
                  className="w-full border-white/40 bg-white/10 text-white sm:w-auto"
                >
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Denvia */}
        <section className="mt-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Why Denvia?
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Built to connect discovery with growth.
            </h2>

            <p className="mt-3 text-gray-600">
              Denvia brings customers and businesses together while making it
              easier for businesses to build their digital presence.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <ValueCard
              icon="⌕"
              title="Discover"
              description="Find businesses, products and services from across the Denvia marketplace."
            />

            <ValueCard
              icon="◫"
              title="Showcase"
              description="Give your business a professional place to present products, services and offers."
            />

            <ValueCard
              icon="↗"
              title="Grow"
              description="Build your online presence and use Denvia's business-growth capabilities."
            />
          </div>
        </section>

        {loading && <MarketplaceLoading />}

        {!loading && error && (
          <Card className="mt-10 rounded-3xl p-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
          </Card>
        )}

        {!loading && !error && discovery && (
          <div className="mt-12 space-y-12">
            {discovery.featuredBusinesses?.length > 0 && (
              <PreviewSection
                eyebrow="Discover"
                title="Featured Businesses"
                description="Explore businesses worth discovering on Denvia."
                viewLabel="View all businesses"
                viewTo="/businesses"
              >
                {discovery.featuredBusinesses.slice(0, 4).map((business) => (
                  <BusinessPreviewCard key={business._id} business={business} />
                ))}
              </PreviewSection>
            )}

            {discovery.trendingProducts?.length > 0 && (
              <PreviewSection
                eyebrow="Marketplace"
                title="Trending Products"
                description="See what customers are discovering across the marketplace."
                viewLabel="Explore products"
                viewTo="/marketplace?type=products"
              >
                {discovery.trendingProducts.slice(0, 4).map((product) => (
                  <ProductPreviewCard key={product._id} product={product} />
                ))}
              </PreviewSection>
            )}

            {discovery.newServices?.length > 0 && (
              <PreviewSection
                eyebrow="Services"
                title="New Services"
                description="Discover new services being offered by businesses on Denvia."
              >
                {discovery.newServices.slice(0, 4).map((service) => (
                  <ServicePreviewCard key={service._id} service={service} />
                ))}
              </PreviewSection>
            )}

            {/* Final CTA */}
            <section className="overflow-hidden rounded-[2rem] bg-gray-900 px-6 py-10 text-center text-white shadow-xl sm:px-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                For businesses
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Ready to grow with Denvia?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
                Create your business presence on Denvia and start showcasing
                what you offer to customers.
              </p>

              <Link
                to={`/register?type=${accountType !== "business" && "business"}`}
                className="mt-6 inline-block"
              >
                <Button className="bg-blue-600 text-white shadow-lg hover:bg-blue-700">
                  Create Business
                </Button>
              </Link>
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}

function PreviewSection({
  eyebrow,
  title,
  description,
  viewLabel,
  viewTo,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  viewLabel?: string;
  viewTo?: string;
  children: React.ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {title}
          </h2>

          <p className="mt-1.5 text-sm text-gray-600">{description}</p>
        </div>

        {viewLabel && viewTo && (
          <Link
            to={viewTo}
            className="shrink-0 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            {viewLabel} →
          </Link>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function BusinessPreviewCard({ business }: { business: DiscoveryBusiness }) {
  const image = business.coverImage || business.logo;

  return (
    <Card className="group h-full overflow-hidden rounded-3xl border-gray-100 p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={business.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ImageFallback icon="🏪" />
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-700 shadow-sm backdrop-blur">
          BUSINESS
        </span>
      </div>

      <div className="p-5">
        {business.category && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {business.category}
          </p>
        )}

        <h3 className="mt-1.5 line-clamp-2 text-lg font-bold text-gray-900">
          {business.name}
        </h3>

        {business.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
            {business.description}
          </p>
        )}
      </div>
    </Card>
  );
}

function ProductPreviewCard({ product }: { product: DiscoveryProduct }) {
  const image = getMediaUrl(product.media);

  return (
    <Card className="group h-full overflow-hidden rounded-3xl border-gray-100 p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ImageFallback icon="🛍" />
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-700 shadow-sm backdrop-blur">
          PRODUCT
        </span>
      </div>

      <div className="flex min-h-[150px] flex-col p-5">
        {product.business?.name && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {product.business.name}
          </p>
        )}

        <h3 className="mt-1.5 line-clamp-2 text-lg font-bold text-gray-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <span className="text-lg font-bold text-blue-600">
            {product.currency} {product.price.toLocaleString()}
          </span>

          {typeof product.compareAtPrice === "number" &&
            product.compareAtPrice > product.price && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                {product.currency} {product.compareAtPrice.toLocaleString()}
              </span>
            )}
        </div>
      </div>
    </Card>
  );
}

function ServicePreviewCard({ service }: { service: DiscoveryService }) {
  const image = service.business?.logo;

  return (
    <Card className="group h-full overflow-hidden rounded-3xl border-gray-100 p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={service.business?.name || service.name}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ImageFallback icon="✦" />
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-700 shadow-sm backdrop-blur">
          SERVICE
        </span>
      </div>

      <div className="flex min-h-[150px] flex-col p-5">
        {service.business?.name && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {service.business.name}
          </p>
        )}

        <h3 className="mt-1.5 line-clamp-2 text-lg font-bold text-gray-900">
          {service.name}
        </h3>

        {service.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
            {service.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <span className="text-lg font-bold text-blue-600">
            {service.currency} {service.price.toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-3xl border-gray-100 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold text-gray-900">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    </Card>
  );
}

function ImageFallback({ icon }: { icon: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
        {icon}
      </div>
    </div>
  );
}

function MarketplaceLoading() {
  return (
    <div className="mt-10 space-y-12">
      {[1, 2, 3].map((section) => (
        <section key={section}>
          <div className="mb-5">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden rounded-3xl border-gray-100 p-0 shadow-sm"
              >
                <div className="relative h-44 animate-pulse overflow-hidden bg-gray-200">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>

                <div className="space-y-3 p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function getMediaUrl(media?: unknown[]) {
  if (!media?.length) {
    return undefined;
  }

  const primary = media.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "isPrimary" in item &&
      Boolean(item.isPrimary),
  );

  const candidate = primary ?? media[0];

  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "url" in candidate &&
    typeof candidate.url === "string"
  ) {
    return candidate.url;
  }

  return undefined;
}

export default HomePage;
