import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

function GuestOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (isAuthenticated) {
    const destination = user?.accountTypes?.includes("business")
      ? "/dashboard"
      : "/";

    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export default GuestOnlyRoute;
