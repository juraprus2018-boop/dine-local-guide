import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

export default function NewRestaurantsPage() {
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['new-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(name, slug),
          cuisines:restaurant_cuisines(cuisine:cuisine_types(id, name, icon, slug))
        `)
        .order('created_at', { ascending: false })
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
      title="Nieuw toegevoegd"
      description="Ontdek de nieuwste restaurants op Happio. Wees een van de eersten om een review te plaatsen."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Vers toegevoegd</span>
          </div>
          <h1 className="font-display text-4xl font-bold">Nieuw toegevoegd</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            De nieuwste restaurants op Happio
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
            <p className="text-muted-foreground">Nog geen nieuwe restaurants gevonden.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
