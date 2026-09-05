import api from './api';

export interface BusinessOperatingHoursDay {
  isOpen: boolean;
  open?: string;
  close?: string;
}

export type BusinessDayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessOperatingHours = Partial<
  Record<BusinessDayOfWeek, BusinessOperatingHoursDay>
>;

export interface BusinessSocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
}

export interface Business {
  _id: string;
  name: string;
  slogan?: string;
  description?: string;
  category?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  location?: {
    country?: string;
    district?: string;
    city?: string;
    address?: string;
  };
  operatingHours?: BusinessOperatingHours;
  socialLinks?: BusinessSocialLinks;
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

interface PublicBusinessResponse {
  success: boolean;
  data: {
    business: Business;
  };
}

export async function getPublicBusiness(
  businessId: string,
): Promise<PublicBusinessResponse> {
  const response = await api.get<PublicBusinessResponse>(
    `/businesses/${businessId}`,
  );
  return response.data;
}

export interface PublicBusinessProduct {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity?: number;
  media?: unknown[];
  status?: string;
}

interface PublicBusinessProductsResponse {
  success: boolean;
  data: {
    products: PublicBusinessProduct[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function getPublicBusinessProducts(
  businessId: string,
): Promise<PublicBusinessProductsResponse> {
  const response = await api.get<PublicBusinessProductsResponse>(
    `/businesses/${businessId}/products`,
  );
  return response.data;
}

interface BusinessWhatsAppResponse {
  success: boolean;
  data: {
    businessId: string;
    businessName: string;
    phone: string;
    whatsappUrl: string;
  };
}

export async function getBusinessWhatsAppLink(
  businessId: string,
  message?: string,
): Promise<BusinessWhatsAppResponse> {
  const response = await api.get<BusinessWhatsAppResponse>(
    `/businesses/${businessId}/whatsapp`,
    {
      params: message ? { message } : undefined,
    },
  );
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