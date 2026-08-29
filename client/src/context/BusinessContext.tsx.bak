/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
import {
  getMyBusinesses,
  selectBusiness,
  type Business,
} from "../services/businessService";

interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBusinessId: string | null;
  isLoading: boolean;
  selectActiveBusiness: (businessId: string) => Promise<Business | null>;
  refreshBusinesses: () => Promise<Business[]>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined,
);

const ACTIVE_BUSINESS_STORAGE_KEY = "activeBusinessId";

interface BusinessProviderProps {
  children: ReactNode;
}

function getStoredBusinessId() {
  return localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
}

function persistBusinessId(businessId: string | null) {
  if (businessId) {
    localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, businessId);
  } else {
    localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
  }
}

export function BusinessProvider({ children }: BusinessProviderProps) {
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolveActiveBusiness = useCallback(
    (availableBusinesses: Business[]) => {
      if (availableBusinesses.length === 0) {
        setActiveBusiness(null);
        persistBusinessId(null);
        return null;
      }

      const storedId = getStoredBusinessId();

      const selectedFromServer =
        availableBusinesses.find((business) => business.isSelected) ?? null;

      const storedBusiness =
        (storedId
          ? availableBusinesses.find((business) => business._id === storedId)
          : null) ?? null;

      const userBusiness = user?.activeBusiness?.id
        ? availableBusinesses.find(
            (business) => business._id === user.activeBusiness?.id,
          )
        : null;

      const resolved =
        selectedFromServer ??
        storedBusiness ??
        userBusiness ??
        availableBusinesses[0];

      setActiveBusiness(resolved);
      persistBusinessId(resolved._id);

      return resolved;
    },
    [user],
  );

  const refreshBusinesses = useCallback(async () => {
    if (!isAuthenticated) {
      setBusinesses([]);
      setActiveBusiness(null);
      persistBusinessId(null);
      return [];
    }

    setIsLoading(true);

    try {
      const response = await getMyBusinesses();
      const availableBusinesses = Array.isArray(response.data?.businesses)
        ? response.data.businesses
        : [];

      setBusinesses(availableBusinesses);
      resolveActiveBusiness(availableBusinesses);

      return availableBusinesses;
    } catch {
      setBusinesses([]);
      setActiveBusiness(null);
      persistBusinessId(null);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, resolveActiveBusiness]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshBusinesses();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refreshBusinesses]);

  const selectActiveBusiness = useCallback(
    async (businessId: string) => {
      if (!businessId) {
        throw new Error("A business must be selected.");
      }

      const targetBusiness = businesses.find(
        (business) => business._id === businessId,
      );

      /*
       * If the business is already active, there is nothing to do.
       */
      if (businessId === activeBusiness?._id) {
        return activeBusiness;
      }

      /*
       * The business list can be temporarily stale immediately after
       * creating a business. Refresh it before declaring the business
       * unavailable.
       */
      let businessToSelect = targetBusiness;

      if (!businessToSelect) {
        try {
          const response = await getMyBusinesses();

          const refreshedBusinesses = Array.isArray(response.data?.businesses)
            ? response.data.businesses
            : [];

          setBusinesses(refreshedBusinesses);

          businessToSelect = refreshedBusinesses.find(
            (business) => business._id === businessId,
          );
        } catch {
          throw new Error("Unable to load your businesses. Please try again.");
        }
      }

      if (!businessToSelect) {
        throw new Error("The selected business is not available.");
      }

      const previousBusiness = activeBusiness;

      setActiveBusiness(businessToSelect);
      persistBusinessId(businessToSelect._id);

      try {
        const response = await selectBusiness(businessId);

        const selectedBusiness = response.data?.business ?? businessToSelect;

        setActiveBusiness(selectedBusiness);
        persistBusinessId(selectedBusiness._id);

        await refreshUser();

        const refreshedBusinesses = await getMyBusinesses();

        const availableBusinesses = Array.isArray(
          refreshedBusinesses.data?.businesses,
        )
          ? refreshedBusinesses.data.businesses
          : [];

        setBusinesses(availableBusinesses);

        const serverSelected =
          availableBusinesses.find((business) => business.isSelected) ??
          availableBusinesses.find(
            (business) => business._id === selectedBusiness._id,
          ) ??
          selectedBusiness;

        setActiveBusiness(serverSelected);
        persistBusinessId(serverSelected._id);

        return serverSelected;
      } catch (error) {
        setActiveBusiness(previousBusiness);
        persistBusinessId(previousBusiness?._id ?? null);
        throw error;
      }
    },
    [activeBusiness, businesses, refreshUser],
  );

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses,
      activeBusiness,
      activeBusinessId: activeBusiness?._id ?? null,
      isLoading,
      selectActiveBusiness,
      refreshBusinesses,
    }),
    [
      businesses,
      activeBusiness,
      isLoading,
      selectActiveBusiness,
      refreshBusinesses,
    ],
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider.");
  }

  return context;
}
