import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { Link } from "react-router-dom";

import Card from "../components/ui/Card";
import Container from "../components/layout/Container";
import LoadingState from "../components/ui/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useBusiness } from "../context/BusinessContext";
import {
  getDiscovery,
  type DiscoveryBusiness,
} from "../services/discoveryService";

function BusinessesPage() {
  const { isAuthenticated } = useAuth();

  const {
    businesses: myBusinesses,
    activeBusiness,
    isLoading: businessesLoading,
    selectActiveBusiness,
  } = useBusiness();

  const [businesses, setBusinesses] = useState<DiscoveryBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState("");
  const [switchingBusiness, setSwitchingBusiness] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const hasBusinesses = myBusinesses.length > 0;

  const showBusinessOnboarding =
    isAuthenticated && !businessesLoading && !hasBusinesses;

  useEffect(() => {
    let mounted = true;

    async function loadBusinesses() {
      try {
        setLoading(true);
        setDiscoveryError("");

        const response = await getDiscovery({
          businessLimit: 50,
        });

        if (!mounted) {
          return;
        }

        const combined = [
          ...response.data.featuredBusinesses,
          ...response.data.trendingBusinesses,
          ...response.data.newBusinesses,
        ];

        const uniqueBusinesses = Array.from(
          new Map(
            combined.map((business) => [business._id, business]),
          ).values(),
        );

        setBusinesses(uniqueBusinesses);
      } catch {
        if (mounted) {
          setDiscoveryError("Unable to load businesses right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadBusinesses();

    return () => {
      mounted = false;
    };
  }, []);

  const myBusinessIds = useMemo(
    () => new Set(myBusinesses.map((business) => business._id)),
    [myBusinesses],
  );

  const discoverableBusinesses = useMemo(
    () => businesses.filter((business) => !myBusinessIds.has(business._id)),
    [businesses, myBusinessIds],
  );

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return discoverableBusinesses;
    }

    return discoverableBusinesses.filter((business) => {
      return (
        business.name.toLowerCase().includes(query) ||
        business.description?.toLowerCase().includes(query) ||
        business.category?.toLowerCase().includes(query)
      );
    });
  }, [discoverableBusinesses, search]);

  async function handleBusinessSwitch(event: ChangeEvent<HTMLSelectElement>) {
    const businessId = event.target.value;

    if (!businessId || businessId === activeBusiness?._id) {
      return;
    }

    try {
      setSwitchError("");
      setSwitchingBusiness(true);
      await selectActiveBusiness(businessId);
    } catch {
      setSwitchError("Unable to switch businesses right now.");
    } finally {
      setSwitchingBusiness(false);
    }
  }

  function getSlogan(
    business: DiscoveryBusiness | (typeof myBusinesses)[number],
  ) {
    const value = (business as Record<string, unknown>).slogan;

    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-96 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />

      <Container>
        {isAuthenticated && !businessesLoading && hasBusinesses && (
          <section className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-200/40">
            <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    {activeBusiness?.logo ? (
                      <img
                        src={activeBusiness.logo}
                        alt={activeBusiness.name}
                        className="h-16 w-16 shrink-0 rounded-2xl border border-white/20 bg-white object-cover shadow-lg"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold shadow-lg ring-1 ring-white/20">
                        {activeBusiness?.name?.charAt(0).toUpperCase() ?? "D"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                        My Businesses
                      </p>

                      <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                        {activeBusiness?.name ?? "Your businesses"}
                      </h1>

                      {activeBusiness && getSlogan(activeBusiness) && (
                        <p className="mt-1 text-sm italic text-blue-100">
                          {getSlogan(activeBusiness)}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-blue-100">
                        {myBusinesses.length}{" "}
                        {myBusinesses.length === 1 ? "business" : "businesses"}{" "}
                        owned by you on Denvia.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Open dashboard
                  </Link>
                </div>

                {myBusinesses.length > 1 && (
                  <div className="max-w-md">
                    <label
                      htmlFor="active-business"
                      className="text-sm font-semibold text-white"
                    >
                      Active business
                    </label>

                    <select
                      id="active-business"
                      value={activeBusiness?._id ?? ""}
                      onChange={handleBusinessSwitch}
                      disabled={switchingBusiness}
                      className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-white focus:ring-4 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {myBusinesses.map((business) => (
                        <option key={business._id} value={business._id}>
                          {business.name}
                        </option>
                      ))}
                    </select>

                    {switchingBusiness && (
                      <p className="mt-2 text-xs font-medium text-blue-100">
                        Switching business...
                      </p>
                    )}

                    {switchError && (
                      <p className="mt-2 text-xs font-medium text-red-200">
                        {switchError}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-white/15 pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-blue-50">
                      Build your brand presence and manage your businesses on
                      Denvia.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Link
                        to="/businesses/manage"
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                      >
                        Manage my businesses
                      </Link>

                      <Link
                        to="/businesses/create"
                        className="text-sm font-bold text-white hover:text-blue-100 hover:underline"
                      >
                        + Create another business
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {showBusinessOnboarding && (
          <section className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-200/40">
            <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Your account is ready
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Create your first business
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                Create a business or organisation to unlock your business
                dashboard and start building your presence on Denvia.
              </p>

              <Link
                to="/businesses/create"
                className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Create your business
              </Link>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-200/40">
          <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                    Denvia Online Market
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Discover Businesses
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                    Discover businesses, stores and service providers from
                    across Denvia.
                  </p>
                </div>

                {!loading && !discoveryError && (
                  <p className="shrink-0 text-sm font-semibold text-blue-100">
                    {filteredBusinesses.length}{" "}
                    {filteredBusinesses.length === 1
                      ? "business"
                      : "businesses"}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="business-search" className="sr-only">
                  Search businesses
                </label>

                <input
                  id="business-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search businesses, categories..."
                  className="w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-white focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-8">
            <LoadingState
              count={6}
              className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
            />
          </div>
        )}

        {!loading && discoveryError && (
          <Card className="mt-8 text-center">
            <p className="font-medium text-red-600">{discoveryError}</p>
          </Card>
        )}

        {!loading && !discoveryError && (
          <section className="mt-8">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Public directory
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {search ? "Search results" : "Other Businesses"}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Explore businesses on Denvia. Your own businesses are not shown
                here.
              </p>
            </div>

            {filteredBusinesses.length === 0 ? (
              <Card className="py-10 text-center">
                <h3 className="font-semibold text-gray-900">
                  No businesses found
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Try a different business name or category.
                </p>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {filteredBusinesses.map((business) => {
                  const location = business.location
                    ? [
                        business.location.address,
                        business.location.city,
                        business.location.country,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : "";

                  const slogan = getSlogan(business);

                  return (
                    <Card
                      key={business._id}
                      className="group flex h-full flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {business.coverImage ? (
                        <div className="relative h-32 overflow-hidden bg-gray-100">
                          <img
                            src={business.coverImage}
                            alt={business.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <div className="h-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100" />
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start gap-3">
                          {business.logo ? (
                            <img
                              src={business.logo}
                              alt={`${business.name} logo`}
                              className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 bg-white object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-bold text-blue-600">
                              {business.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-bold text-gray-900">
                              {business.name}
                            </h3>

                            {business.category && (
                              <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wide text-blue-600">
                                {business.category}
                              </p>
                            )}
                          </div>
                        </div>

                        {slogan && (
                          <p className="mt-3 line-clamp-2 text-sm font-medium italic leading-5 text-gray-700">
                            “{slogan}”
                          </p>
                        )}

                        {!slogan && business.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-600">
                            {business.description}
                          </p>
                        )}

                        {location && (
                          <p className="mt-auto pt-4 text-xs text-gray-500">
                            {location}
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </Container>
    </main>
  );
}

export default BusinessesPage;
