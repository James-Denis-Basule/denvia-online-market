import api from "./api";

export type ServiceStatus = "active" | "archived" | "draft";

export type PricingType = "fixed" | "starting_from" | "negotiable" | "free";

export interface Service {
  _id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  price?: number;
  currency: string;
  pricingType: PricingType;
  duration?: number;
  status: ServiceStatus;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceInput {
  businessId: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  pricingType?: PricingType;
  duration?: number;
  status?: ServiceStatus;
  isVisible?: boolean;
}

export type UpdateServiceInput = Partial<
  Omit<CreateServiceInput, "businessId">
>;

interface ServiceResponse {
  success: boolean;
  message?: string;
  data: {
    service: Service;
  };
}

interface ServicesResponse {
  success: boolean;
  data: {
    services: Service[];
  };
}

export async function getMyServices(businessId: string) {
  const token = localStorage.getItem("accessToken");

  const response = await api.get<ServicesResponse>(
    `/services/business/${businessId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function createService(input: CreateServiceInput) {
  const token = localStorage.getItem("accessToken");

  const response = await api.post<ServiceResponse>("/services", input, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function updateService(
  serviceId: string,
  input: UpdateServiceInput,
) {
  const token = localStorage.getItem("accessToken");

  const response = await api.patch<ServiceResponse>(
    `/services/${serviceId}`,
    input,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function deleteService(serviceId: string) {
  const token = localStorage.getItem("accessToken");

  const response = await api.delete(`/services/${serviceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}


export async function getDeletedServices(businessId: string) {
  const token = localStorage.getItem("accessToken");

  const response = await api.get<ServicesResponse>(
    `/services/business/${businessId}/bin`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function restoreService(serviceId: string) {
  const token = localStorage.getItem("accessToken");

  const response = await api.post<ServiceResponse>(
    `/services/${serviceId}/restore`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}
