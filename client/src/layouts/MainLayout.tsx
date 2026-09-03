import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const LOGO_URL =
  "https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png";

function MainLayout() {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const isBusinessAccount =
    isAuthenticated && auth?.user?.activeAccountType === "business";

  const hasBusinessAccount =
    isAuthenticated && Boolean(auth?.user?.accountTypes?.includes("business"));

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const isDashboard = location.pathname.startsWith("/dashboard");
  const homeDestination = isBusinessAccount ? "/dashboard" : "/";

  const customerNavigation = [
    { label: "Home", to: "/" },
    { label: "Businesses", to: "/businesses" },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Cart", to: "/cart" },
    { label: "Orders", to: "/orders" },
  ];

  const businessNavigation = [
    { label: "Home", to: "/" },
    { label: "Businesses", to: "/businesses" },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Cart", to: "/cart" },
    { label: "Orders", to: "/orders" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Services", to: "/services/manage" },
    { label: "AI Assistant", to: "/chat" },
  ];

  const publicNavigation = [
    { label: "Home", to: "/" },
    { label: "Businesses", to: "/businesses" },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Cart", to: "/cart" },
  ];

  const navigation = !isAuthenticated
    ? publicNavigation
    : isBusinessAccount
      ? businessNavigation
      : customerNavigation;

  const userName = auth?.user
    ? `${auth.user.firstName ?? ""} ${auth.user.lastName ?? ""}`.trim()
    : "";

  const userInitial =
    userName.charAt(0).toUpperCase() ||
    auth?.user?.email?.charAt(0).toUpperCase() ||
    "U";

  const handleLogout = async () => {
    if (!auth) return;

    await auth.logout();
    navigate("/login");
  };

  const handleAccountSwitch = async (accountType: "customer" | "business") => {
    if (!auth || accountType === auth.user?.activeAccountType) {
      setAccountMenuOpen(false);
      return;
    }

    try {
      await auth.switchAccountType(accountType);
      setAccountMenuOpen(false);

      if (accountType === "business") {
        navigate("/dashboard");
      } else {
        navigate("/marketplace");
      }
    } catch (error) {
      console.error("Failed to switch account mode:", error);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group relative rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200",
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
    ].join(" ");

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "whitespace-nowrap rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-200",
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={homeDestination}
            className="group flex min-w-0 shrink-0 items-center gap-3"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-200 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-blue-200">
              <img
                src={LOGO_URL}
                alt="Denvia Online Market"
                className="relative z-10 h-full w-full object-contain"
              />
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-gray-950">
                Denvia <span className="text-blue-600">Online Market</span>
              </span>

              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {isDashboard ? "Business Center" : "Discover • Connect • Grow"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={navLinkClass}
              >
                {item.label}

                <span
                  className={[
                    "absolute bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-200",
                    "group-hover:w-3",
                  ].join(" ")}
                />
              </NavLink>
            ))}

            {isAuthenticated ? (
              <div className="relative ml-3 border-l border-gray-200 pl-3">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2.5 py-1.5 transition hover:border-blue-200 hover:bg-blue-50"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {userInitial}
                  </span>

                  <div className="hidden text-left lg:block">
                    <p className="max-w-[130px] truncate text-sm font-semibold text-gray-900">
                      {userName || "Account"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isBusinessAccount ? "Business mode" : "Customer mode"}
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    {accountMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {accountMenuOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
                    role="menu"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {userName || "Account"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {auth?.user?.email}
                      </p>
                    </div>

                    {hasBusinessAccount && (
                      <>
                        <div className="my-1 border-t border-gray-100" />

                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Switch account
                        </p>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleAccountSwitch("customer")}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-700">
                            Customer
                          </span>
                          {auth?.user?.activeAccountType === "customer" && (
                            <span className="font-bold text-blue-600">✓</span>
                          )}
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleAccountSwitch("business")}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-blue-50"
                        >
                          <span className="font-medium text-gray-700">
                            Business
                          </span>
                          {auth?.user?.activeAccountType === "business" && (
                            <span className="font-bold text-blue-600">✓</span>
                          )}
                        </button>
                      </>
                    )}

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/account");
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Account settings
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2 border-l border-gray-200 pl-3">
                <Link
                  to="/login"
                  className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-2xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <>
        {isDashboard && isAuthenticated && (
          <div className="border-b border-blue-100/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                  <img
                    src={LOGO_URL}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
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
      </>

      <main className="flex-1">
        <Outlet />
      </main>

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
