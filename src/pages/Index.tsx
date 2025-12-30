import { Link } from 'react-router-dom';
import { ArrowRight, Utensils } from 'lucide-react';
import { Layout } from '@/components/layout';
import { SearchBar } from '@/components/search/SearchBar';
import { CityCard } from '@/components/cities/CityCard';
import { CuisineChip } from '@/components/cuisines/CuisineChip';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { useCities, useCuisines, useRestaurants } from '@/hooks/useRestaurants';

export default function Index() {
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: cuisines, isLoading: cuisinesLoading } = useCuisines();
  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({ 
    sortBy: 'rating', 
    limit: 6 
  });

  const popularCities = cities?.slice(0, 6) || [];
  const featuredCuisines = cuisines?.slice(0, 10) || [];
  const topRestaurants = restaurantsData?.restaurants || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in">
              Ontdek de{' '}
              <span className="text-gradient">beste restaurants</span>{' '}
              in Nederland
            </h1>
            <p className="mt-6 text-lg text-muted-foreground animate-slide-up stagger-1">
              Van gezellige eetcafés tot sterrenrestaurants. Vind jouw perfecte eetplek, 
              lees reviews en maak herinneringen.
            </p>

            {/* Search Bar */}
            <div className="mt-8 animate-slide-up stagger-2">
              <SearchBar variant="hero" />
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in stagger-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <span>1000+ restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>50.000+ reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span>20+ steden</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Popular Cities - Only show if there are cities */}
      {(citiesLoading || popularCities.length > 0) && (
        <section className="py-16 md:py-24">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-semibold">Populaire steden</h2>
                <p className="mt-2 text-muted-foreground">
                  Ontdek restaurants in steden door heel Nederland
                </p>
              </div>
              <Button variant="ghost" asChild className="hidden md:flex">
                <Link to="/ontdek">
                  Alle steden
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {citiesLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
                ))
              ) : (
                popularCities.map((city, index) => (
                  <CityCard 
                    key={city.id} 
                    city={city}
                    className={`animate-slide-up stagger-${index + 1}`}
                  />
                ))
              )}
            </div>

            <div className="mt-6 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link to="/ontdek">
                  Alle steden bekijken
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Cuisines */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container-wide">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-semibold">Welke keuken zoek je?</h2>
            <p className="mt-2 text-muted-foreground">
              Van Italiaans tot Indonesisch - ontdek alle smaken
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {cuisinesLoading ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="h-10 w-28 skeleton rounded-full" />
              ))
            ) : (
              featuredCuisines.map((cuisine) => (
                <CuisineChip key={cuisine.id} cuisine={cuisine} />
              ))
            )}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/keukens">
                Alle keukens bekijken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Top Rated Restaurants */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-semibold">Top beoordeeld</h2>
              <p className="mt-2 text-muted-foreground">
                De best beoordeelde restaurants door onze community
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link to="/top">
                Bekijk meer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantsLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
              ))
            ) : (
              topRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            )}
          </div>

          {topRestaurants.length === 0 && !restaurantsLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Er zijn nog geen restaurants toegevoegd. Kom snel terug!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Heb je een restaurant?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Voeg je restaurant toe aan Happio en bereik duizenden potentiële gasten. 
              Gratis en binnen 5 minuten geregeld.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/aanmelden">Restaurant aanmelden</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/claimen">Bestaand restaurant claimen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
