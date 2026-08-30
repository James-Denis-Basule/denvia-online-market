import api from './api';

export interface Business {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  coverImage?: string;
  slug?: string;
  isActive?: boolean;
  isSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface BusinessResponse {
  success: boolean;
  message?: string;
  data: {
    business: Business;
  };
}

interface BusinessesResponse {
  success: boolean;
  data: {
    businesses: Business[];
  };
}
interface BusinessImageUploadResponse {
  success: boolean;
  message?: string;
  data: {
    url: string;
    publicId: string;
    type: "logo" | "cover";
  };
}

export async function getMyBusinesses(): Promise<BusinessesResponse> {
  const response = await api.get<BusinessesResponse>('/businesses/my-businesses');
  return response.data;
}

export async function getMyBusiness(
  businessId: string,
): Promise<BusinessResponse> {
  const response = await api.get<BusinessResponse>(
    `/businesses/my/${businessId}`,
  );
  return response.data;
}

export async function selectBusiness(
  businessId: string,
): Promise<BusinessResponse> {
  const response = await api.patch<BusinessResponse>(
    `/businesses/${businessId}/select`,
  );
  return response.data;
}

export async function createBusiness(
  payload: Record<string, unknown>,
): Promise<BusinessResponse> {
  const response = await api.post<BusinessResponse>('/businesses', payload);
  return response.data;
}

export async function updateBusiness(
  businessId: string,
  payload: Record<string, unknown>,
): Promise<BusinessResponse> {
  const response = await api.patch<BusinessResponse>(
    `/businesses/my/${businessId}`,
    payload,
  );
  return response.data;
}

export async function deleteBusiness(
  businessId: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await api.delete<{
    success: boolean;
    message?: string;
  }>(`/businesses/${businessId}`);

  return response.data;
}

export async function uploadBusinessImage(
  businessId: string,
  file: File,
  type: "logo" | "cover",
): Promise<BusinessImageUploadResponse> {
  const formData = new FormData();

  formData.append("image", file);
  formData.append("type", type);

  const response = await api.post<BusinessImageUploadResponse>(
    `/businesses/${businessId}/image`,
    formData,
  );

  return response.data;
}