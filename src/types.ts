export type Language = 'en' | 'ar';

export type PriceRange = 'all' | 'under40' | '40to80' | 'over80';

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  category: string;
  priceUsd: number;
  oldPriceUsd?: number | null;
  sizes: string[];
  colors: string[];
  images: string[];
  inStock: boolean;
  isNew: boolean;
  isSale: boolean;
  descriptionEn?: string;
  descriptionAr?: string;
  sortOrder?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  image: string;
  sortOrder: number;
}

export interface Brand {
  id: string;
  name: string;
  sortOrder: number;
}

export interface StoreInfo {
  heroImages: string[];
  heroTitleEn: string;
  heroTitleAr: string;
  heroSubtitleEn: string;
  heroSubtitleAr: string;
  aboutEn: string;
  aboutAr: string;
  addressEn: string;
  addressAr: string;
  hoursEn: string;
  hoursAr: string;
  whatsappNumber: string;
  phoneDisplay: string;
  facebookUrl: string;
  mapsEmbedUrl: string;
  mapsLinkUrl: string;
  galleryImages: string[];
  codeConfigured?: boolean;
  catalogSeeded?: boolean;
  updatedAt?: number;
}
