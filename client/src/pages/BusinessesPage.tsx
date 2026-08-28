import { useEffect, useMemo, useState } from 'react';

import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
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

    loadBusinesses();

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
    <main className="min-h-screen py-10">
      <Container>
        <section className="rounded-2xl bg-white px-6 py-10 shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Denvia Online Market
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            Businesses
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Discover businesses, stores and service providers on Denvia
            Online Market.
          </p>

          <div className="mt-6">
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
              placeholder="Search businesses..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </section>

        {loading && (
          <Card className="mt-8 text-center">
            <p className="text-gray-600">
              Loading businesses...
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card className="mt-8 text-center">
            <p className="font-medium text-red-600">
              {error}
            </p>
          </Card>
        )}

        {!loading && !error && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {search ? 'Search Results' : 'Discover Businesses'}
              </h2>

              <span className="text-sm text-gray-500">
                {filteredBusinesses.length}{' '}
                {filteredBusinesses.length === 1
                  ? 'business'
                  : 'businesses'}
              </span>
            </div>

            {filteredBusinesses.length === 0 ? (
              <Card className="text-center">
                <h3 className="font-semibold text-gray-900">
                  No businesses found
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Try a different search term.
                </p>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                      className="h-full transition hover:-translate-y-1 hover:shadow-md"
                    >
                      {business.coverImage && (
                        <img
                          src={business.coverImage}
                          alt={business.name}
                          className="mb-4 h-40 w-full rounded-xl object-cover"
                        />
                      )}

                      <div className="flex items-start gap-3">
                        {business.logo && (
                          <img
                            src={business.logo}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}

                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {business.name}
                          </h3>

                          {business.category && (
                            <p className="mt-1 text-sm text-blue-600">
                              {business.category}
                            </p>
                          )}
                        </div>
                      </div>

                      {business.description && (
                        <p className="mt-4 line-clamp-3 text-sm text-gray-600">
                          {business.description}
                        </p>
                      )}

                      {location && (
                        <p className="mt-4 text-sm text-gray-500">
                          {location}
                        </p>
                      )}
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