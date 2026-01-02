import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { City } from '@/types/database';

interface CityWithCount extends City {
  restaurant_count: number;
}

export function usePopularCities(limit = 6) {
  return useQuery({
    queryKey: ['popularCities', limit],
    queryFn: async () => {
      // Get cities with restaurant counts
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (citiesError) throw citiesError;

      // Get restaurant counts per city
      const { data: counts, error: countsError } = await supabase
        .from('restaurants')
        .select('city_id')
        .not('city_id', 'is', null);

      if (countsError) throw countsError;

      // Count restaurants per city
      const countMap = new Map<string, number>();
      for (const r of counts || []) {
        countMap.set(r.city_id, (countMap.get(r.city_id) || 0) + 1);
      }

      // Add counts to cities and sort by count
      const citiesWithCounts: CityWithCount[] = (cities || [])
        .map((city) => ({
          ...city,
          restaurant_count: countMap.get(city.id) || 0,
        }))
        .sort((a, b) => b.restaurant_count - a.restaurant_count)
        .slice(0, limit);

      return citiesWithCounts;
    },
  });
}
