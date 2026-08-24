import { Link, Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-gray-900"
          >
            Denvia <span className="text-blue-600">Online Market</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Home
            </Link>

            <Link
              to="/businesses"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Businesses
            </Link>

            <Link
              to="/products"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Products
            </Link>

            <Link
              to="/cart"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Cart
            </Link>

            <Link
              to="/orders"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Orders
            </Link>

            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Denvia Online Market. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;