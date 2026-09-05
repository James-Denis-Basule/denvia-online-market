import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

import {
  Globe,
  MessageCircle,
  MapPin,
  Mail,
  Phone,
  Clock,
} from "lucide-react";

import Container from "../components/layout/Container";
import Card from "../components/ui/Card";
import LoadingState from "../components/ui/LoadingState";

import {
  getPublicBusiness,
  getPublicBusinessProducts,
  getBusinessWhatsAppLink,
  type Business,
  type PublicBusinessProduct,
} from "../services/businessService";

import { addToCart } from "../services/commerceService";
import type { FaF } from "react-icons/fa6";

const DAYS: { key: string; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatPrice(price: number, currency = "UGX") {
  const formatted = new Intl.NumberFormat("en-UG").format(price);
  return `${currency} ${formatted}`;
}

function getProductImage(product: PublicBusinessProduct) {
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
    typeof (first as { url?: unknown }).url === "string"
  ) {
    return (first as { url: string }).url;
  }

  return undefined;
}

function todayKey() {
  const dayIndex = new Date().getDay();
  return DAYS[(dayIndex + 6) % 7]?.key;
}

function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<PublicBusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [businessResponse, productsResponse] = await Promise.all([
          getPublicBusiness(id!),
          getPublicBusinessProducts(id!).catch(() => null),
        ]);

        if (cancelled) return;

        setBusiness(businessResponse.data.business);
        setProducts(productsResponse?.data.products ?? []);
      } catch (err: unknown) {
        if (cancelled) return;

        const axiosError = err as {
          response?: { data?: { message?: string } };
        };

        setError(
          axiosError.response?.data?.message ||
            "This business could not be found.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleWhatsAppClick() {
    if (!id) return;

    try {
      const response = await getBusinessWhatsAppLink(id);
      window.open(response.data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Business has no WhatsApp or phone number configured — silently
      // do nothing rather than surfacing a confusing error for a
      // secondary contact channel.
    }
  }

  async function handleAddToCart(product: PublicBusinessProduct) {
    if (!id) return;

    await addToCart({
      productId: product._id,
      businessId: id,
      name: product.name,
      price: product.price,
      quantity: 1,
      currency: product.currency,
      image: getProductImage(product),
    });

    setAddedProductId(product._id);
    setTimeout(() => setAddedProductId(null), 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <Container>
          <LoadingState count={1} />
        </Container>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <Container>
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Business not found
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {error || "This business is no longer available."}
            </p>
            <Link
              to="/businesses"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse businesses
            </Link>
          </section>
        </Container>
      </main>
    );
  }

  const location = business.location
    ? [
        business.location.address,
        business.location.city,
        business.location.district,
        business.location.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const socialIcons: {
    key: keyof NonNullable<Business["socialLinks"]>;
    Icon: typeof FaFacebookF | typeof FaInstagram | typeof FaLinkedinIn;
    label: string;
  }[] = [
    { key: "facebook", Icon: FaFacebookF, label: "Facebook" },
    { key: "instagram", Icon: FaInstagram, label: "Instagram" },
    { key: "linkedin", Icon: FaLinkedinIn, label: "LinkedIn" },
  ];

  const currentDay = todayKey();

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-100 to-gray-100 sm:h-64">
        {business.coverImage && (
          <img
            src={business.coverImage}
            alt={`${business.name} cover`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <Container>
        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {business.logo ? (
              <img
                src={business.logo}
                alt={`${business.name} logo`}
                className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-3xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="pb-1">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                {business.name}
              </h1>

              {business.category && (
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                  {business.category}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>

        {business.slogan && (
          <p className="mt-5 text-lg font-medium italic text-gray-700">
            “{business.slogan}”
          </p>
        )}

        {business.description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            {business.description}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900">Products</h2>

              {products.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  This business hasn't listed any products yet.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const image = getProductImage(product);

                    return (
                      <div
                        key={product._id}
                        className="flex flex-col overflow-hidden rounded-xl border border-gray-100"
                      >
                        <div className="h-32 bg-gray-100">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-semibold text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-3">
                          <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-blue-600">
                            {formatPrice(product.price, product.currency)}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="mt-auto pt-3 text-xs font-bold uppercase tracking-wide text-blue-600 hover:text-blue-700"
                          >
                            {addedProductId === product._id
                              ? "Added ✓"
                              : "Add to cart"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {business.operatingHours && (
              <Card className="p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Business hours
                </h2>

                <div className="mt-4 divide-y divide-gray-100">
                  {DAYS.map((day) => {
                    const hours = business.operatingHours?.[
                      day.key as keyof NonNullable<Business["operatingHours"]>
                    ];

                    const isToday = day.key === currentDay;

                    return (
                      <div
                        key={day.key}
                        className={[
                          "flex items-center justify-between py-2.5 text-sm",
                          isToday ? "font-bold text-gray-900" : "text-gray-600",
                        ].join(" ")}
                      >
                        <span>{day.label}</span>
                        <span>
                          {hours?.isOpen
                            ? `${hours.open ?? "—"} – ${hours.close ?? "—"}`
                            : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900">Contact</h2>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{location}</span>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-blue-600" />
                    <a
                      href={`tel:${business.phone}`}
                      className="hover:text-blue-700"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-blue-600" />
                    <a
                      href={`mailto:${business.email}`}
                      className="hover:text-blue-700"
                    >
                      {business.email}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {business.socialLinks &&
              Object.values(business.socialLinks).some(Boolean) && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Follow this business
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {socialIcons.map(({ key, Icon, label }) => {
                      const url = business.socialLinks?.[key];

                      if (!url) return null;

                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={label}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}

                    {business.socialLinks?.tiktok && (
                      <a
                        href={business.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="TikTok"
                        className="flex h-10 items-center justify-center rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        TikTok
                      </a>
                    )}

                    {business.socialLinks?.x && (
                      <a
                        href={business.socialLinks.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="X"
                        className="flex h-10 items-center justify-center rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        X
                      </a>
                    )}
                  </div>
                </Card>
              )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default BusinessDetailPage;
