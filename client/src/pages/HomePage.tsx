import { useEffect, useState } from 'react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import {
  getDiscovery,
  type DiscoveryData,
} from '../services/discoveryService';

function HomePage() {
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDiscovery() {
      try {
        setLoading(true);
        setError('');

        const response = await getDiscovery();

        if (mounted) {
          setDiscovery(response.data);
        }
      } catch {
        if (mounted) {
          setError('Unable to load marketplace discovery right now.');
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
    <main className="min-h-screen bg-gray-50 py-10">
      <Container>
        <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm sm:px-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Denvia
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Denvia Online Market
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Discover businesses, products and services from across the Denvia
            marketplace.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button>Create Business</Button>
            <Button variant="outline">Explore Businesses</Button>
          </div>
        </section>

        {loading && (
          <Card className="mt-8 text-center">
            <p className="text-gray-600">Loading marketplace discovery...</p>
          </Card>
        )}

        {!loading && error && (
          <Card className="mt-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
          </Card>
        )}

        {!loading && !error && discovery && (
          <div className="mt-10 space-y-10">
            <DiscoverySection
              title="Featured Businesses"
              items={discovery.featuredBusinesses}
              renderItem={(business) => (
                <Card key={business._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {business.name}
                  </h3>
                  {business.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {business.description}
                    </p>
                  )}
                </Card>
              )}
            />

            <DiscoverySection
              title="Trending Businesses"
              items={discovery.trendingBusinesses}
              renderItem={(business) => (
                <Card key={business._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {business.name}
                  </h3>
                  {business.category && (
                    <p className="mt-2 text-sm text-gray-500">
                      {business.category}
                    </p>
                  )}
                </Card>
              )}
            />

            <DiscoverySection
              title="New Businesses"
              items={discovery.newBusinesses}
              renderItem={(business) => (
                <Card key={business._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {business.name}
                  </h3>
                  {business.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {business.description}
                    </p>
                  )}
                </Card>
              )}
            />

            <DiscoverySection
              title="Trending Products"
              items={discovery.trendingProducts}
              renderItem={(product) => (
                <Card key={product._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="mt-2 font-medium text-blue-600">
                    {product.currency} {product.price}
                  </p>
                </Card>
              )}
            />

            <DiscoverySection
              title="New Products"
              items={discovery.newProducts}
              renderItem={(product) => (
                <Card key={product._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="mt-2 font-medium text-blue-600">
                    {product.currency} {product.price}
                  </p>
                </Card>
              )}
            />

            <DiscoverySection
              title="New Services"
              items={discovery.newServices}
              renderItem={(service) => (
                <Card key={service._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <p className="mt-2 font-medium text-blue-600">
                    {service.currency} {service.price}
                  </p>
                </Card>
              )}
            />

            <DiscoverySection
              title="Categories"
              items={discovery.categories}
              renderItem={(category) => (
                <Card key={category._id} className="h-full">
                  <h3 className="font-semibold text-gray-900">
                    {category.name}
                  </h3>
                </Card>
              )}
            />

            {(discovery.promotions.products.length > 0 ||
              discovery.promotions.posts.length > 0) && (
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Promotions
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {discovery.promotions.products.map((product) => (
                    <Card key={product._id}>
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm text-blue-600">
                        {product.currency} {product.price}
                      </p>
                    </Card>
                  ))}

                  {discovery.promotions.posts.map((post) => (
                    <Card key={post._id}>
                      <h3 className="font-semibold text-gray-900">
                        {post.title || 'Special Offer'}
                      </h3>

                      {post.content && (
                        <p className="mt-2 text-sm text-gray-600">
                          {post.content}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Container>
    </main>
  );
}

interface DiscoverySectionProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function DiscoverySection<T>({
  title,
  items,
  renderItem,
}: DiscoverySectionProps<T>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold text-gray-900">{title}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(renderItem)}
      </div>
    </section>
  );
}

export default HomePage;
