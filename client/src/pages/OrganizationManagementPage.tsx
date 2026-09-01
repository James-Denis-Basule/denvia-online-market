import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Container from "../components/layout/Container";
import Card from "../components/ui/Card";
import BusinessManagementCard from "../components/ui/BusinessManagementCard";
import LoadingState from "../components/ui/LoadingState";

import { useBusiness } from "../context/BusinessContext";

import { deleteBusiness, type Business } from "../services/businessService";

import {
  getOrganization,
  getOrganizationBusinesses,
} from "../services/organizationService";

import type { Organization } from "../types/organization";

function OrganizationManagementPage() {
  const { id } = useParams<{ id: string }>();

  const { activeBusiness, selectActiveBusiness, refreshBusinesses } =
    useBusiness();

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [workingId, setWorkingId] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState(id ? "" : "Organization not found.");

  async function loadOrganization(
  organizationId: string,
  showLoading = true,
) {
  try {
    if (showLoading) {
      setIsLoading(true);
    }

    setError("");

    const [organizationResponse, businessesResponse] =
      await Promise.all([
        getOrganization(organizationId),
        getOrganizationBusinesses(organizationId),
      ]);

    setOrganization(organizationResponse.data.organization);

    setBusinesses(
      businessesResponse.data.businesses as Business[],
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load organization.",
    );
  } finally {
    if (showLoading) {
      setIsLoading(false);
    }
  }
}

useEffect(() => {
  if (!id) {
    return;
  }

  let cancelled = false;

  const organizationId = id;

  async function fetchOrganization() {
    try {
      const [organizationResponse, businessesResponse] =
        await Promise.all([
          getOrganization(organizationId),
          getOrganizationBusinesses(organizationId),
        ]);

      if (cancelled) {
        return;
      }

      setOrganization(organizationResponse.data.organization);
      setBusinesses(
        businessesResponse.data.businesses as Business[],
      );
      setError("");
    } catch (err) {
      if (cancelled) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization.",
      );
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  void fetchOrganization();

  return () => {
    cancelled = true;
  };
}, [id]);

  async function handleSelect(businessId: string) {
    try {
      setWorkingId(businessId);
      setError("");

      await selectActiveBusiness(businessId);
      await refreshBusinesses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to switch active business.",
      );
    } finally {
      setWorkingId("");
    }
  }

  async function handleDelete(businessId: string, businessName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${businessName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(businessId);
      setError("");

      await deleteBusiness(businessId);

      if (id) {
        await loadOrganization(id);
      }

      await refreshBusinesses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete business.",
      );
    } finally {
      setWorkingId("");
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !organization) {
    return (
      <Container>
        <div className="py-12">
          <Card>
            <div className="p-6">
              <h1 className="text-xl font-semibold text-gray-900">
                Organization unavailable
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                {error || "The organization could not be found."}
              </p>

              <Link
                to="/businesses"
                className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                Back to Businesses
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <div className="mb-6">
          <Link
            to="/businesses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Businesses
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {organization.name}
          </h1>

          {organization.description && (
            <p className="mt-2 text-gray-600">{organization.description}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Businesses
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {businesses.length}{" "}
                  {businesses.length === 1 ? "business" : "businesses"} in this
                  organization.
                </p>
              </div>

              <Link
                to={`/organizations/${organization._id}/businesses/create`}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                + Add Business
              </Link>
            </div>

            {businesses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  No businesses yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                  This organization has no businesses. Add your first business
                  to get started.
                </p>

                <Link
                  to={`/organizations/${organization._id}/businesses/create`}
                  className="mt-5 inline-flex rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
                >
                  Create Business
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {businesses.map((business) => (
                  <BusinessManagementCard
                    key={business._id}
                    business={business}
                    isActive={business._id === activeBusiness?._id}
                    isWorking={workingId === business._id}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    showDelete
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}

export default OrganizationManagementPage;
