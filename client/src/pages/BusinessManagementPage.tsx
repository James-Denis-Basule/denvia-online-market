import { useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/layout/Container";
import LoadingState from "../components/ui/LoadingState";
import { useBusiness } from "../context/BusinessContext";
import { deleteBusiness } from "../services/businessService";

function BusinessManagementPage() {
  const {
    businesses,
    activeBusiness,
    isLoading,
    selectActiveBusiness,
    refreshBusinesses,
  } = useBusiness();

  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  async function handleSelect(businessId: string) {
    try {
      setError("");
      setWorkingId(businessId);
      await selectActiveBusiness(businessId);
    } catch {
      setError("Unable to switch businesses right now.");
    } finally {
      setWorkingId("");
    }
  }

  async function handleDelete(businessId: string, businessName: string) {
    const confirmed = window.confirm(
      `Delete "${businessName}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setWorkingId(businessId);
      await deleteBusiness(businessId);
      await refreshBusinesses();
    } catch {
      setError("Unable to delete this business right now.");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-64 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl shadow-blue-200/40 sm:px-10 sm:py-12">
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Business management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Manage your businesses
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage your businesses, switch between them, open dashboards, and
              create new business profiles from one place.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/businesses/create"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                + Create business
              </Link>

              <Link
                to="/organizations/create"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                + Create organization
              </Link>
              
              <Link
                to="/businesses"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl hover:bg-white/20"
              >
                Discover businesses
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8">
            <LoadingState count={3} className="lg:grid-cols-3" />
          </div>
        ) : businesses.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
              +
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No businesses yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Create your first business to start managing your presence on
              Denvia.
            </p>

            <Link
              to="/businesses/create"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Create your business
            </Link>
          </section>
        ) : (
          <section className="relative mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Your businesses
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Business accounts
                </h2>
              </div>

              <span className="text-sm font-medium text-gray-500">
                {businesses.length}{" "}
                {businesses.length === 1 ? "business" : "businesses"}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => {
                const isActive = business._id === activeBusiness?._id;
                const isWorking = workingId === business._id;

                return (
                  <article
                    key={business._id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isActive
                        ? "border-blue-300 ring-2 ring-blue-100"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
                      {business.coverImage && (
                        <img
                          src={business.coverImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="p-5">
                      <div className="-mt-10 flex items-end justify-between">
                        {business.logo ? (
                          <img
                            src={business.logo}
                            alt={business.name}
                            className="h-16 w-16 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 text-xl font-bold text-blue-600 shadow-md">
                            {business.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {isActive && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Active
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 truncate text-lg font-bold text-gray-900">
                        {business.name}
                      </h3>

                      {business.category && (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                          {business.category}
                        </p>
                      )}

                      {business.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-600">
                          {business.description}
                        </p>
                      )}

                      <div className="mt-5">
                        <div className="grid grid-cols-2 gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => void handleSelect(business._id)}
                              className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isWorking ? "Switching..." : "Make active"}
                            </button>
                          )}

                          <Link
                            to={`/businesses/edit/${business._id}`}
                            className={`${
                              isActive ? "col-span-2" : ""
                            } block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50`}
                          >
                            Edit
                          </Link>
                        </div>

                        <Link
                          to="/dashboard"
                          className="mt-3 block w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Open dashboard
                        </Link>

                        <Link
                          to={`/businesses/${business._id}/staff`}
                          className="mt-3 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Manage staff
                        </Link>

                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() =>
                            void handleDelete(business._id, business.name)
                          }
                          className="mt-3 w-full rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete business
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}

export default BusinessManagementPage;
