import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';

function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <Container>
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Denvia
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Denvia Online Market
          </h1>

          <p className="mt-3 text-lg text-gray-600">
            Connect. Market. Grow.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button>Create Business</Button>
            <Button variant="outline">Explore Businesses</Button>
          </div>
        </div>

        <Card className="mx-auto mt-12 max-w-xl text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome to DOM
          </h2>

          <p className="mt-2 text-gray-600">
            Discover businesses, products and services.
          </p>
        </Card>
      </Container>
    </main>
  );
}

export default HomePage;