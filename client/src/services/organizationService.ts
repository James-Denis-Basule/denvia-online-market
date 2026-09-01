import api from "./api";
import type {
  CreateOrganizationPayload,
  OrganizationResponse,
  OrganizationsResponse,
} from "../types/organization";

export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<OrganizationResponse> {
  const response = await api.post<OrganizationResponse>(
    "/organizations",
    payload,
  );

  return response.data;
}

export async function getMyOrganizations(): Promise<OrganizationsResponse> {
  const response = await api.get<OrganizationsResponse>("/organizations");

  return response.data;
}

export async function getOrganization(
  organizationId: string,
): Promise<OrganizationResponse> {
  const response = await api.get<OrganizationResponse>(
    `/organizations/${organizationId}`,
  );

  return response.data;
}

export async function getOrganizationBusinesses(
  organizationId: string,
) {
  const response = await api.get<{
    success: boolean;
    data: {
      businesses: Array<{
        _id: string;
        name: string;
        description?: string;
        category?: string;
        logo?: string;
        location?: {
          city?: string;
          district?: string;
          country?: string;
        };
      }>;
    };
  }>(`/organizations/${organizationId}/businesses`);

  return response.data;
}