import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant, RestaurantFilters, City, CuisineType } from '@/types/database';

// Fetch restaurants with filters
export function useRestaurants(filters: RestaurantFilters = {}) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(*),
          cuisines:restaurant_cuisines(cuisine:cuisine_types(*))
        `);

      // Apply filters
      if (filters.citySlug) {
        const { data: city } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', filters.citySlug)
          .single();
        
        if (city) {
          query = query.eq('city_id', city.id);
        }
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.minReviews) {
        query = query.gte('review_count', filters.minReviews);
      }

      if (filters.priceRange && filters.priceRange.length > 0) {
        query = query.in('price_range', filters.priceRange);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Sorting
      const sortBy = filters.sortBy || 'rating';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy === 'reviews' ? 'review_count' : sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform cuisines data
      const restaurants = (data || []).map((r: any) => ({
        ...r,
        cuisines: r.cuisines?.map((c: any) => c.cuisine) || [],
      })) as Restaurant[];

      return { restaurants, count };
    },
  });
}

// Fetch single restaurant by slug and city
export function useRestaurant(citySlug: string, restaurantSlug: string) {
  return useQuery({
    queryKey: ['restaurant', citySlug, restaurantSlug],
    queryFn: async () => {
      // First get city
      const { data: city } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', citySlug)
        .single();

      if (!city) throw new Error('City not found');

      // Fetch restaurant data
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(*),
          cuisines:restaurant_cuisines(cuisine:cuisine_types(*))
        `)
        .eq('slug', restaurantSlug)
        .eq('city_id', city.id)
        .single();

      if (error) throw error;

      // Fetch photos separately to avoid nested query limits
      const { data: photos } = await supabase
        .from('restaurant_photos')
        .select('*')
        .eq('restaurant_id', data.id)
        .eq('is_approved', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      return {
        ...data,
        cuisines: data.cuisines?.map((c: any) => c.cuisine) || [],
        photos: photos || [],
      } as Restaurant;
    },
    enabled: !!citySlug && !!restaurantSlug,
  });
}

// Fetch all cities
export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as City[];
    },
  });
}

// Fetch single city by slug
export function useCity(slug: string) {
  return useQuery({
    queryKey: ['city', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as City;
    },
    enabled: !!slug,
  });
}

// Fetch all cuisine types
export function useCuisines() {
  return useQuery({
    queryKey: ['cuisines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuisine_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as CuisineType[];
    },
  });
}

// Fetch reviews for a restaurant
export function useReviews(restaurantId: string) {
  return useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
}

// Fetch nearby restaurants based on coordinates
export function useNearbyRestaurants(latitude: number | null, longitude: number | null, limit = 10) {
  return useQuery({
    queryKey: ['nearbyRestaurants', latitude, longitude, limit],
    queryFn: async () => {
      if (!latitude || !longitude) return [];

      // Fetch all restaurants with city info
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(*),
          cuisines:restaurant_cuisines(cuisine:cuisine_types(*))
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      // Calculate distance and sort
      const restaurantsWithDistance = (data || []).map((r: any) => {
        const distance = calculateDistance(latitude, longitude, r.latitude, r.longitude);
        return {
          ...r,
          cuisines: r.cuisines?.map((c: any) => c.cuisine) || [],
          distance,
        };
      });

      // Sort by distance and limit
      return restaurantsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
    },
    enabled: !!latitude && !!longitude,
  });
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Add review mutation
export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      restaurant_id: string;
      rating: number;
      title?: string;
      content?: string;
      user_id?: string;
      guest_name?: string;
      guest_email?: string;
      restaurant_name?: string;
      city_name?: string;
    }) => {
      const { restaurant_name, city_name, user_id, ...restData } = review;
      
      // Prepare review data - ensure proper user_id handling for RLS policies
      const reviewData = {
        ...restData,
        user_id: user_id || null, // Explicitly set to null for guest reviews
      };
      
      console.log('Submitting review:', { ...reviewData, restaurant_name, city_name });
      
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error('Review insert error:', error);
        throw error;
      }

      // Send review notification emails
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'review',
            data: {
              reviewerEmail: review.guest_email,
              reviewerName: review.guest_name,
              restaurantName: restaurant_name || 'Restaurant',
              cityName: city_name,
              rating: review.rating,
              content: review.content,
            },
          },
        });
      } catch (emailError) {
        console.error('Failed to send review notification email:', emailError);
        // Don't fail the review if email fails
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

// Favorites
export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          restaurant:restaurants(*, city:cities(*))
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, restaurantId }: { userId: string; restaurantId: string }) => {
      // Check if favorite exists
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, restaurant_id: restaurantId });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
}

// Check if restaurant is favorited
export function useIsFavorite(userId: string | undefined, restaurantId: string) {
  return useQuery({
    queryKey: ['isFavorite', userId, restaurantId],
    queryFn: async () => {
      if (!userId) return false;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      return !!data;
    },
    enabled: !!userId && !!restaurantId,
  });
}

// Search across restaurants, cities, cuisines
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { restaurants: [], cities: [], cuisines: [] };

      const [restaurantsRes, citiesRes, cuisinesRes] = await Promise.all([
        supabase
          .from('restaurants')
          .select('*, city:cities(*)')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('cities')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('cuisine_types')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      return {
        restaurants: restaurantsRes.data || [],
        cities: citiesRes.data || [],
        cuisines: cuisinesRes.data || [],
      };
    },
    enabled: query.length >= 2,
  });
}

// Fetch all restaurant locations for map display (lightweight - only coordinates)
export function useRestaurantLocations() {
  return useQuery({
    queryKey: ['restaurantLocations'],
    queryFn: async () => {
      // Fetch in batches to get all restaurants
      const allRestaurants: Array<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        slug: string;
        city: { slug: string } | null;
      }> = [];
      
      let page = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * batchSize;
        const to = from + batchSize - 1;
        
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, latitude, longitude, slug, city:cities(slug)')
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allRestaurants.push(...data);
          hasMore = data.length === batchSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allRestaurants;
    },
  });
}
