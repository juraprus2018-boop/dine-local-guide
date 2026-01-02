import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';

export default function TopRatedPage() {
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['top-rated-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(name, slug),
          cuisines:restaurant_cuisines(cuisine:cuisine_types(id, name, icon, slug))
        `)
        .gte('rating', 4)
        .gte('review_count', 1)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(24);

      if (error) throw error;
      return data?.map(r => ({
        ...r,
        cuisines: r.cuisines?.map((c: any) => c.cuisine).filter(Boolean) || []
      }));
    },
  });

  return (
    <Layout
      title="Top beoordeeld"
      description="Ontdek de best beoordeelde restaurants in Nederland. Alleen de hoogst gewaardeerde eetplekken."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning mb-4">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Hoogste ratings</span>
          </div>
          <h1 className="font-display text-4xl font-bold">Top beoordeeld</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            De best beoordeelde restaurants in Nederland
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
            ))}
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((restaurant: any) => (
              <Link 
                key={restaurant.id}
                to={`/${restaurant.city?.slug}/${restaurant.slug}`}
              >
                <RestaurantCard restaurant={restaurant} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nog geen top beoordeelde restaurants gevonden.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
