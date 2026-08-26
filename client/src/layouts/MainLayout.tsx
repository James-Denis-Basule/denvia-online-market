import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MainLayout() {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const isDashboard = location.pathname.startsWith('/dashboard');

  const publicNavigation = [
    { label: 'Home', to: '/' },
    { label: 'Businesses', to: '/businesses' },
    { label: 'Products', to: '/products' },
    { label: 'Cart', to: '/cart' },
    { label: 'Orders', to: '/orders' },
  ];

  const authenticatedNavigation = [
    { label: 'Home', to: '/' },
    { label: 'Businesses', to: '/businesses' },
    { label: 'Products', to: '/products' },
    { label: 'Cart', to: '/cart' },
    { label: 'Orders', to: '/orders' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'AI Assistant', to: '/chat' },
  ];

  const navigation = isAuthenticated
    ? authenticatedNavigation
    : publicNavigation;

  const userName = auth?.user
    ? `${auth.user.firstName ?? ''} ${auth.user.lastName ?? ''}`.trim()
    : '';

  const userInitial =
    userName.charAt(0).toUpperCase() ||
    auth?.user?.email?.charAt(0).toUpperCase() ||
    'U';

  const handleLogout = async () => {
    if (!auth) return;

    await auth.logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group relative rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200',
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
    ].join(' ');

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    ].join(' ');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Main navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="group flex min-w-0 shrink-0 items-center gap-3"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-md shadow-blue-200 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-blue-200">
              <span className="relative z-10">D</span>
              <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/15" />
              <span className="absolute -bottom-4 -left-2 h-7 w-7 rounded-full bg-white/10" />
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-gray-950">
                Denvia{' '}
                <span className="text-blue-600">Online Market</span>
              </span>

              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {isDashboard ? 'Business Center' : 'Discover • Connect • Grow'}
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={navLinkClass}
              >
                {item.label}

                <span
                  className={[
                    'absolute bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-200',
                    'group-hover:w-3',
                  ].join(' ')}
                />
              </NavLink>
            ))}

            {!isAuthenticated ? (
              <div className="ml-3 flex items-center gap-2 border-l border-gray-200 pl-3">
                <NavLink
                  to="/login"
                  className={navLinkClass}
                >
                  Login
                </NavLink>

                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200/60 transition duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-200/70"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2 border-l border-gray-200 pl-3">
                {/* User account */}
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {userInitial}
                  </span>

                  <div className="hidden max-w-32 lg:block">
                    <p className="truncate text-xs font-bold text-gray-900">
                      {userName || 'Account'}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500">
                      Business account
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition duration-200 hover:bg-red-50 hover:text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* Mobile top actions */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {userInitial}
                </span>

                <Link
                  to="/dashboard"
                  className={[
                    'rounded-xl px-3 py-2 text-xs font-bold transition',
                    isDashboard
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700',
                  ].join(' ')}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="border-t border-gray-100/80 bg-white/80 md:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 lg:px-8">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={mobileNavLinkClass}
              >
                {item.label}
              </NavLink>
            ))}

            {!isAuthenticated ? (
              <Link
                to="/register"
                className="whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Get Started
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Dashboard context bar */}
      {isDashboard && isAuthenticated && (
        <div className="border-b border-blue-100/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white shadow-sm">
                D
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                Business Center
              </span>
            </div>

            <span className="hidden text-xs font-medium text-blue-700 sm:block">
              Manage your business, orders and growth
            </span>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:px-6 lg:px-8">
          <span className="text-sm font-medium text-gray-500">
            © {new Date().getFullYear()} Denvia Online Market.
          </span>

          <span className="text-xs font-medium text-gray-400">
            Business growth • Marketing • Marketplace
          </span>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;