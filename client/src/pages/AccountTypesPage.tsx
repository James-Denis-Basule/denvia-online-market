import { Link } from 'react-router-dom';

import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const LOGO_URL =
  'https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png';

function AccountTypesPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <img
              src={LOGO_URL}
              alt="Denvia Online Market"
              className="mx-auto h-16 w-16 rounded-2xl object-contain shadow-sm"
            />

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Denvia Online Market
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Choose how you want to use Denvia
            </h1>

            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
              Choose the account experience that best matches what you want
              to do on Denvia. You can start as a customer and later activate
              business capabilities without creating another login.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="flex h-full flex-col rounded-3xl border-gray-100 p-7 shadow-lg shadow-gray-200/50 sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                👤
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Customer Account
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                Shop and discover on Denvia
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                A Customer Account is for people who want to discover
                businesses, products and services and interact with businesses
                on Denvia.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Discover businesses and products',
                  'Browse products and services',
                  'Place and track orders',
                  'Chat with businesses',
                  'Manage your customer activity',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link to="/register?type=customer">
                  <Button className="w-full">
                    Continue as Customer
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="flex h-full flex-col rounded-3xl border-blue-100 p-7 shadow-lg shadow-blue-100/60 sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl">
                🏪
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Business Account
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                Build and manage your business presence
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                A Business Account is your business workspace on Denvia. It
                lets you create an organization or manage multiple businesses
                independently from one client account.
              </p>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-sm font-bold text-gray-900">
                  One client. Multiple businesses.
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  You can create an organization and place multiple businesses
                  under it, or manage multiple businesses independently.
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {[
                  'Create an organization',
                  'Create and manage multiple businesses',
                  'Showcase products and services',
                  'Manage business activity',
                  'Grow your business presence',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link to="/register?type=business">
                  <Button className="w-full">
                    Create Business Account
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-gray-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <h3 className="font-bold text-gray-900">
              Not sure which one to choose?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Start with a Customer Account if you mainly want to shop and
              discover. When you're ready to sell or manage businesses, use
              <strong> Start selling on DOM </strong>
              to activate business capabilities on the same account.
            </p>

            <p className="mt-3 text-xs font-medium text-gray-400">
              You do not need a second login to become a business client.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

export default AccountTypesPage;
