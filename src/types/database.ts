// Database types for Happio
export type PriceRange = '€' | '€€' | '€€€' | '€€€€';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type AppRole = 'admin' | 'moderator' | 'user';

export interface City {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CuisineType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  google_place_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  postal_code: string | null;
  city_id: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  email: string | null;
  price_range: PriceRange | null;
  rating: number;
  review_count: number;
  image_url: string | null;
  is_verified: boolean;
  is_claimed: boolean;
  owner_id: string | null;
  opening_hours: OpeningHours | null;
  features: string[];
  specialties: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  city?: City;
  cuisines?: CuisineType[];
  photos?: RestaurantPhoto[];
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface RestaurantPhoto {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  url: string;
  caption: string | null;
  is_primary: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
  restaurant?: Restaurant;
}

export interface RestaurantClaim {
  id: string;
  restaurant_id: string;
  user_id: string;
  status: ClaimStatus;
  business_email: string;
  phone: string | null;
  message: string | null;
  documents_url: string[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

// Filter types
export interface RestaurantFilters {
  citySlug?: string;
  cuisineSlug?: string;
  priceRange?: PriceRange[];
  minRating?: number;
  features?: string[];
  isOpen?: boolean;
  search?: string;
  sortBy?: 'rating' | 'reviews' | 'name' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Search result type
export interface SearchResult {
  restaurants: Restaurant[];
  cities: City[];
  cuisines: CuisineType[];
}

// Map bounds
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Google Places types for import
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  opening_hours?: {
    weekday_text?: string[];
  };
  formatted_phone_number?: string;
  website?: string;
}
