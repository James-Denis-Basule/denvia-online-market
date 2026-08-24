import api from './api';

export interface DiscoveryBusiness {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  location?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscoveryProduct {
  _id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity?: number;
  categoryId?: string;
  status: string;
  isVisible: boolean;
  media?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  business?: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface DiscoveryService {
  _id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  price: number;
  currency: string;
  pricingType?: string;
  duration?: string;
  status: string;
  isVisible: boolean;
  createdAt?: string;
  business?: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface DiscoveryCategory {
  _id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface DiscoveryPromotionProduct
  extends DiscoveryProduct {
  type: 'product_discount';
}

export interface DiscoveryPromotionPost {
  _id: string;
  type: 'special_offer' | 'product_promotion';
  title?: string;
  content?: string;
  hashtags?: string[];
  media?: unknown[];
  productId?: string;
  eventDate?: string;
  businessId: string;
  createdAt?: string;
  business?: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface DiscoveryPromotions {
  products: DiscoveryPromotionProduct[];
  posts: DiscoveryPromotionPost[];
}

export interface DiscoveryData {
  featuredBusinesses: DiscoveryBusiness[];
  trendingBusinesses: DiscoveryBusiness[];
  newBusinesses: DiscoveryBusiness[];
  trendingProducts: DiscoveryProduct[];
  newProducts: DiscoveryProduct[];
  newServices: DiscoveryService[];
  promotions: DiscoveryPromotions;
  categories: DiscoveryCategory[];
}

interface DiscoveryResponse {
  success: boolean;
  data: DiscoveryData;
}

export async function getDiscovery(
  params?: {
    businessLimit?: number;
    productLimit?: number;
    serviceLimit?: number;
    postLimit?: number;
    categoryLimit?: number;
  },
) {
  const response = await api.get<DiscoveryResponse>(
    '/discovery',
    { params },
  );

  return response.data;
}
