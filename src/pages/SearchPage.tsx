import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Utensils, SlidersHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch, useRestaurants } from '@/hooks/useRestaurants';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const { data: searchResults, isLoading: searchLoading } = useSearch(debouncedQuery);
  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    search: debouncedQuery,
    limit: 20,
  });

  const restaurants = restaurantsData?.restaurants || [];
  const hasResults = searchResults?.restaurants?.length || searchResults?.cities?.length || searchResults?.cuisines?.length || restaurants.length;

  return (
    <Layout
      title="Zoeken"
      description="Zoek naar restaurants, steden of keukens in heel Nederland"
    >
      {/* Search Header */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-12">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-center font-display text-3xl font-bold mb-6">
              Zoek restaurants
            </h1>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek op restaurant, keuken of stad..."
                className="h-14 pl-12 pr-4 text-lg rounded-xl border-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>

            {debouncedQuery && (
              <p className="mt-4 text-center text-muted-foreground">
                {searchLoading || restaurantsLoading ? (
                  'Zoeken...'
                ) : hasResults ? (
                  `Resultaten voor "${debouncedQuery}"`
                ) : (
                  `Geen resultaten gevonden voor "${debouncedQuery}"`
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container-wide">
          {/* Quick Results - Cities & Cuisines */}
          {debouncedQuery && (searchResults?.cities?.length > 0 || searchResults?.cuisines?.length > 0) && (
            <div className="mb-10 space-y-6">
              {/* Cities */}
              {searchResults?.cities?.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Steden
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.cities.map((city: any) => (
                      <Link
                        key={city.id}
                        to={`/${city.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <MapPin className="h-4 w-4" />
                        {city.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuisines */}
              {searchResults?.cuisines?.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Keukens
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.cuisines.map((cuisine: any) => (
                      <Link
                        key={cuisine.id}
                        to={`/keukens/${cuisine.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <span>{cuisine.icon}</span>
                        {cuisine.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Restaurants */}
          <div>
            {debouncedQuery && (
              <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Restaurants
              </h2>
            )}

            {searchLoading || restaurantsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : debouncedQuery ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Geen restaurants gevonden
                </h3>
                <p className="text-muted-foreground mb-6">
                  Probeer een andere zoekterm of bekijk onze populaire steden
                </p>
                <Button asChild>
                  <Link to="/ontdek">Ontdek restaurants</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Begin met zoeken
                </h3>
                <p className="text-muted-foreground">
                  Typ een restaurantnaam, keuken of stad om te beginnen
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
