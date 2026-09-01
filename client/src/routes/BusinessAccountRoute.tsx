import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function BusinessAccountRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  const isBusinessAccount =
    user.accountTypes?.includes("business") ?? false;

  if (!isBusinessAccount) {
    return (
      <Navigate
        to="/account-types"
        replace
        state={{
          from: location.pathname + location.search,
          requiresBusinessAccount: true,
        }}
      />
    );
  }

  return <Outlet />;
}

export default BusinessAccountRoute;
