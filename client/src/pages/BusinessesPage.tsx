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
import {
  getMyOrganizations,
  getOrganizationBusinesses,
} from "../services/organizationService";
import type { Organization } from "../types/organization";
import type { Business } from "../services/businessService";

function BusinessesPage() {
  const { user, isAuthenticated } = useAuth();

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

  const [showOrganizationReminder, setShowOrganizationReminder] = useState(
    () =>
      localStorage.getItem("organizationReminderDismissed") !== "true",
  );

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationBusinesses, setOrganizationBusinesses] = useState<
    Record<string, Business[]>
  >({});

  const hasBusinesses = myBusinesses.length > 0;
  const isBusinessAccount = user?.accountTypes?.includes("business");

  const organization =
    organizations.length === 1 ? organizations[0] : undefined;

  const activeOrganizationBusinesses = organization
    ? (organizationBusinesses[organization._id] ?? [])
    : [];

  const isOrganizationUser =
    isAuthenticated && isBusinessAccount && !!organization;

  const organizationBusinessCount = activeOrganizationBusinesses.length;

  const showBusinessOnboarding =
    isAuthenticated &&
    isBusinessAccount &&
    !businessesLoading &&
    !hasBusinesses &&
    organizations.length === 0;

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
  }, [businessesLoading]);

  useEffect(() => {
  if (!isAuthenticated || !isBusinessAccount) {
    return;
  }

  let mounted = true;

  async function loadOrganizations() {
    try {
      const response = await getMyOrganizations();

      if (!mounted) {
        return;
      }

      const orgs = response.data.organizations;

      setOrganizations(orgs);

      const businessResults = await Promise.all(
        orgs.map(async (organization) => {
          const businessesResponse = await getOrganizationBusinesses(
            organization._id,
          );

          return [
            organization._id,
            businessesResponse.data.businesses,
          ] as const;
        }),
      );

      if (!mounted) {
        return;
      }

      setOrganizationBusinesses(Object.fromEntries(businessResults));
    } catch {
      if (mounted) {
        setOrganizations([]);
        setOrganizationBusinesses({});
      }
    }
  }

  void loadOrganizations();

  return () => {
    mounted = false;
  };
}, [isAuthenticated, isBusinessAccount]);

  const discoverableBusinesses = useMemo(
  () =>
    businesses.filter(
      (business) =>
        !myBusinesses.some(
          (myBusiness) => myBusiness._id === business._id,
        ),
    ),
  [businesses, myBusinesses],
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

  async function handleBusinessSwitch(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
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

  function dismissOrganizationReminder() {
    localStorage.setItem("organizationReminderDismissed", "true");
    setShowOrganizationReminder(false);
  }

  function getSlogan(
    business: DiscoveryBusiness | (typeof myBusinesses)[number],
  ) {
    const value = (business as Record<string, unknown>).slogan;

    return typeof value === "string" && value.trim()
      ? value.trim()
      : undefined;
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
                {/* Header */}
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
                        {isOrganizationUser
                          ? "Organization"
                          : "My Businesses"}
                      </p>

                      <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                        {isOrganizationUser
                          ? organization?.name
                          : (activeBusiness?.name ?? "Your businesses")}
                      </h1>

                      {isOrganizationUser && organization?.description && (
                        <p className="mt-1 text-sm text-blue-100">
                          {organization.description}
                        </p>
                      )}

                      {!isOrganizationUser &&
                        activeBusiness &&
                        getSlogan(activeBusiness) && (
                          <p className="mt-1 text-sm italic text-blue-100">
                            {getSlogan(activeBusiness)}
                          </p>
                        )}

                      <p className="mt-2 text-sm text-blue-100">
                        {isOrganizationUser
                          ? `${organizationBusinessCount} ${
                              organizationBusinessCount === 1
                                ? "business"
                                : "businesses"
                            } owned by you on Denvia.`
                          : `${myBusinesses.length} ${
                              myBusinesses.length === 1
                                ? "business"
                                : "businesses"
                            } owned by you on Denvia.`}
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

                {/* Active business */}
                {isOrganizationUser ? (
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                          Active business
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-white">
                          {activeBusiness?.name ?? "No active business"}
                        </h2>
                      </div>

                      <div className="rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15">
                        <p className="text-2xl font-bold">
                          {organizationBusinessCount}
                        </p>

                        <p className="text-xs text-blue-100">
                          {organizationBusinessCount === 1
                            ? "Business"
                            : "Businesses"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  myBusinesses.length > 1 && (
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
                  )
                )}

                {/* Organization reminder */}
                {showOrganizationReminder && !isOrganizationUser && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Growing beyond one business?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-100">
                        You can create and manage multiple businesses on
                        Denvia, or organize them under an organization.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={dismissOrganizationReminder}
                      className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-white/15 pt-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-blue-50">
                      {isOrganizationUser
                        ? "Build your brand presence and manage your organization on Denvia."
                        : "Build your brand presence and manage your businesses on Denvia."}
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {isOrganizationUser ? (
                        <>
                          <Link
                            to={`/organizations/${organization?._id}`}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
                          >
                            Manage Organization
                          </Link>

                          <Link
                            to={`/organizations/${organization?._id}/businesses/create`}
                            className="text-sm font-bold text-white hover:text-blue-100 hover:underline"
                          >
                            + Create New Business
                          </Link>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                  Business setup
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  How do you want to manage your business?
                </h1>

                <p className="mt-3 text-sm leading-6 text-blue-50 sm:text-base">
                  Choose the setup that fits how you plan to operate on Denvia.
                  You can change your structure later.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <Link
                  to="/businesses/create"
                  className="group rounded-2xl border border-white/20 bg-white p-6 text-gray-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    🏪
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    Just one business
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Manage a single business independently.
                  </p>

                  <span className="mt-5 inline-flex text-sm font-bold text-blue-600 group-hover:text-blue-700">
                    Create one business →
                  </span>
                </Link>

                <Link
                  to="/organizations/create"
                  className="group rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg ring-1 ring-white/20 transition hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-xl ring-1 ring-white/20">
                    🏢
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    Multiple businesses
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-blue-50">
                    Create an organization to manage multiple businesses
                    together.
                  </p>

                  <span className="mt-5 inline-flex text-sm font-bold text-white group-hover:text-blue-100">
                    Create an organization →
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Denvia Online Market
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Discover Businesses
                  </h2>

                  <p className="mt-1.5 max-w-2xl text-sm leading-5 text-gray-500">
                    Discover businesses, stores and service providers from
                    across Denvia.
                  </p>
                </div>

                {!loading && !discoveryError && (
                  <div className="shrink-0 rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-semibold text-gray-700">
                    {filteredBusinesses.length}{" "}
                    {filteredBusinesses.length === 1
                      ? "business"
                      : "businesses"}
                  </div>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="business-search"
                  className="sr-only"
                >
                  Search businesses
                </label>

                <input
                  id="business-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search businesses, categories..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
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
            <p className="font-medium text-red-600">
              {discoveryError}
            </p>
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
                Explore businesses on Denvia. Your own businesses are not
                shown here.
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