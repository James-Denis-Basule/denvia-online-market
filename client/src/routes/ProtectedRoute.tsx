import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useBusiness } from '../context/BusinessContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    businesses,
    isLoading: businessesLoading,
  } = useBusiness();

  const location = useLocation();

  if (authLoading || (isAuthenticated && businessesLoading)) {
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (businesses.length === 0) {
    return (
      <Navigate
        to="/businesses"
        replace
        state={{
          from: location.pathname + location.search,
          requiresBusiness: true,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
