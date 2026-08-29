import { useEffect, useMemo, useState } from 'react';

import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import LoadingState from '../components/ui/LoadingState';
import {
  getDiscovery,
  type DiscoveryBusiness,
} from '../services/discoveryService';

function BusinessesPage() {
  const [businesses, setBusinesses] = useState<DiscoveryBusiness[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadBusinesses() {
      try {
        setLoading(true);
        setError('');

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
          setError('Unable to load businesses right now.');
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

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return businesses;
    }

    return businesses.filter((business) => {
      return (
        business.name.toLowerCase().includes(query) ||
        business.description?.toLowerCase().includes(query) ||
        business.category?.toLowerCase().includes(query)
      );
    });
  }, [businesses, search]);

  return (
    <main className="min-h-screen py-8 sm:py-10">
      <Container>
        <section className="rounded-2xl border border-gray-100 bg-white px-5 py-8 shadow-sm sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Denvia Online Market
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Discover businesses
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                  Find businesses, stores and service providers on Denvia
                  Online Market.
                </p>
              </div>

              {!loading && !error && (
                <p className="shrink-0 text-sm font-medium text-gray-500">
                  {filteredBusinesses.length}{' '}
                  {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label htmlFor="business-search" className="sr-only">
                Search businesses
              </label>

              <div className="relative">
                <input
                  id="business-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search businesses, categories..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
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

        {!loading && error && (
          <Card className="mt-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
          </Card>
        )}

        {!loading && !error && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {search ? 'Search results' : 'Businesses'}
              </h2>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {filteredBusinesses.map((business) => {
                  const location = business.location
                    ? [
                        business.location.address,
                        business.location.city,
                        business.location.country,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : '';

                  return (
                    <Card
                      key={business._id}
                      className="group flex h-full flex-col overflow-hidden p-0 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {business.coverImage ? (
                        <div className="relative h-36 overflow-hidden bg-gray-100">
                          <img
                            src={business.coverImage}
                            alt={business.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : (
                        <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100" />
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start gap-3">
                          {business.logo ? (
                            <img
                              src={business.logo}
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-xl border border-gray-100 bg-white object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                              {business.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-gray-900">
                              {business.name}
                            </h3>

                            {business.category && (
                              <p className="mt-0.5 truncate text-xs font-medium text-blue-600">
                                {business.category}
                              </p>
                            )}
                          </div>
                        </div>

                        {business.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-600">
                            {business.description}
                          </p>
                        )}

                        {location && (
                          <div className="mt-auto pt-4">
                            <p className="truncate text-xs text-gray-500">
                              {location}
                            </p>
                          </div>
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
