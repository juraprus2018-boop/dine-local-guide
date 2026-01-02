import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { CuisineChip } from '@/components/cuisines/CuisineChip';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { useCuisines, useRestaurants } from '@/hooks/useRestaurants';

export default function CuisinesPage() {
  const { cuisineSlug } = useParams<{ cuisineSlug: string }>();
  const { data: cuisines, isLoading: cuisinesLoading } = useCuisines();
  
  const selectedCuisine = cuisineSlug 
    ? cuisines?.find(c => c.slug === cuisineSlug) 
    : null;

  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    cuisineSlug,
    limit: 20,
  });

  const restaurants = restaurantsData?.restaurants || [];

  // Cuisine JSON-LD
  const cuisineJsonLd = selectedCuisine ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${selectedCuisine.name} restaurants in Nederland`,
    "description": `Ontdek de beste ${selectedCuisine.name.toLowerCase()} restaurants`,
    "numberOfItems": restaurants.length,
    "itemListElement": restaurants.slice(0, 10).map((r, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Restaurant",
        "name": r.name,
        "servesCuisine": selectedCuisine.name
      }
    }))
  } : {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Alle keukens in Nederland",
    "numberOfItems": cuisines?.length || 0
  };

  return (
    <Layout
      title={selectedCuisine ? `${selectedCuisine.name} restaurants in Nederland` : 'Alle keukens'}
      description={selectedCuisine 
        ? `Ontdek de ${restaurants.length} beste ${selectedCuisine.name.toLowerCase()} restaurants in Nederland. Lees reviews en vind jouw favoriet.`
        : 'Ontdek alle keukens en cuisines in Nederland. Van Italiaans tot Indonesisch, vind het restaurant dat bij jou past.'
      }
      jsonLd={cuisineJsonLd}
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/keukens" className="hover:text-foreground">Keukens</Link>
            {selectedCuisine && (
              <>
                <span>/</span>
                <span className="text-foreground">{selectedCuisine.name}</span>
              </>
            )}
          </div>

          {selectedCuisine ? (
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedCuisine.icon}</span>
              <div>
                <h1 className="font-display text-3xl font-bold md:text-4xl">
                  {selectedCuisine.name} restaurants
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {restaurants.length} restaurants gevonden
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Alle keukens
              </h1>
              <p className="mt-2 text-muted-foreground">
                Ontdek restaurants per keuken type
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cuisine chips */}
      <section className="border-b py-6">
        <div className="container-wide">
          <div className="flex flex-wrap gap-2">
            <Link to="/keukens">
              <Button 
                variant={!cuisineSlug ? 'default' : 'outline'} 
                size="sm"
              >
                Alle
              </Button>
            </Link>
            {cuisinesLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-9 w-24 skeleton rounded-full" />
              ))
            ) : (
              cuisines?.map((cuisine) => (
                <Link key={cuisine.id} to={`/keukens/${cuisine.slug}`}>
                  <Button
                    variant={cuisineSlug === cuisine.slug ? 'default' : 'outline'}
                    size="sm"
                  >
                    {cuisine.icon} {cuisine.name}
                  </Button>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 md:py-12">
        <div className="container-wide">
          {restaurantsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl font-medium">Geen restaurants gevonden</p>
              <p className="mt-2 text-muted-foreground">
                {selectedCuisine 
                  ? `Er zijn nog geen ${selectedCuisine.name.toLowerCase()} restaurants toegevoegd.`
                  : 'Er zijn nog geen restaurants toegevoegd.'}
              </p>
              <Button asChild className="mt-6">
                <Link to="/ontdek">Bekijk alle steden</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
