import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { MapPin, Filter, Grid, List, SlidersHorizontal, Utensils, Star, TrendingUp } from 'lucide-react';
import NotFound from './NotFound';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AdBlock } from '@/components/ads/AdBlock';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCity, useRestaurants, useCuisines } from '@/hooks/useRestaurants';
import { useTrackPageView } from '@/hooks/usePageViews';
import type { PriceRange } from '@/types/database';

const priceRangeOptions: PriceRange[] = ['€', '€€', '€€€', '€€€€'];

// Dynamic SEO content generator
function generateCityContent(cityName: string, province: string, restaurantCount: number, topCuisines: string[]) {
  const currentMonth = new Date().toLocaleDateString('nl-NL', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const introVariants = [
    `${cityName} is een culinaire hotspot in ${province} met maar liefst ${restaurantCount} restaurants om uit te kiezen.`,
    `Ontdek de beste eetgelegenheden van ${cityName}. Van gezellige bistro's tot fine dining - ${province} heeft het allemaal.`,
    `Op zoek naar een goed restaurant in ${cityName}? Wij hebben ${restaurantCount} opties voor je verzameld.`,
  ];
  
  const cuisineText = topCuisines.length > 0 
    ? `Populaire keukens in ${cityName} zijn onder andere ${topCuisines.slice(0, 3).join(', ')}.`
    : `${cityName} biedt een diverse mix van culinaire stijlen.`;
  
  const ctaVariants = [
    `Bekijk reviews, foto's en menu's om jouw perfecte restaurant te vinden.`,
    `Lees beoordelingen van andere bezoekers en ontdek verborgen parels.`,
    `Filter op prijsklasse, keuken of beoordeling voor de beste match.`,
  ];
  
  // Use city name to deterministically pick variants (consistent per city)
  const hash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    intro: introVariants[hash % introVariants.length],
    cuisines: cuisineText,
    cta: ctaVariants[(hash + 1) % ctaVariants.length],
    updated: `Laatst bijgewerkt: ${currentMonth} ${currentYear}`,
  };
}

export default function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrices, setSelectedPrices] = useState<PriceRange[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');

  const { data: city, isLoading: cityLoading } = useCity(citySlug || '');
  const { data: cuisines } = useCuisines();
  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    citySlug,
    priceRange: selectedPrices.length > 0 ? selectedPrices : undefined,
    minRating,
    sortBy,
    search: searchParams.get('q') || undefined,
    limit: 1000,
  });

  // Track page view
  useTrackPageView({ pageType: 'city', pageSlug: citySlug });

  const restaurants = restaurantsData?.restaurants || [];

  // Calculate statistics for dynamic content
  const stats = useMemo(() => {
    if (!restaurants.length) return null;
    
    const withReviews = restaurants.filter((r: any) => r.review_count > 0);
    const avgRating = withReviews.length > 0 
      ? (withReviews.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0) / withReviews.length).toFixed(1)
      : null;
    
    // Get top cuisines from restaurants
    const cuisineCounts: Record<string, number> = {};
    restaurants.forEach((r: any) => {
      r.cuisines?.forEach((c: any) => {
        if (c?.name) {
          cuisineCounts[c.name] = (cuisineCounts[c.name] || 0) + 1;
        }
      });
    });
    
    const topCuisines = Object.entries(cuisineCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);
    
    return {
      totalRestaurants: restaurants.length,
      reviewedRestaurants: withReviews.length,
      avgRating,
      topCuisines,
    };
  }, [restaurants]);

  // Generate dynamic SEO content
  const dynamicContent = useMemo(() => {
    if (!city) return null;
    return generateCityContent(
      city.name, 
      city.province || '', 
      restaurants.length,
      stats?.topCuisines || []
    );
  }, [city, restaurants.length, stats?.topCuisines]);

  const togglePrice = (price: PriceRange) => {
    setSelectedPrices(prev =>
      prev.includes(price) ? prev.filter(p => p !== price) : [...prev, price]
    );
  };

  const clearFilters = () => {
    setSelectedPrices([]);
    setSelectedCuisines([]);
    setMinRating(undefined);
  };

  const hasActiveFilters = selectedPrices.length > 0 || selectedCuisines.length > 0 || minRating;

  if (cityLoading) {
    return (
      <Layout>
        <div className="container-wide py-8">
          <div className="h-8 w-48 skeleton rounded mb-4" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
      </Layout>
    );
  }

  if (!city) {
    return <NotFound />;
  }

  // City/Place JSON-LD structured data
  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `https://www.eatspot.nl/${city.slug}#place`,
    "name": city.name,
    "description": city.meta_description || `Ontdek de beste restaurants in ${city.name}`,
    "url": `https://www.eatspot.nl/${city.slug}`,
    "image": city.image_url || undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": city.province,
      "addressCountry": "NL"
    },
    ...(city.latitude && city.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": city.latitude,
        "longitude": city.longitude
      }
    } : {})
  };

  // ItemList JSON-LD for restaurant list
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Restaurants in ${city.name}`,
    "description": city.meta_description || `Ontdek de beste restaurants in ${city.name}`,
    "url": `https://www.eatspot.nl/${city.slug}`,
    "numberOfItems": restaurants.length,
    "itemListElement": restaurants.slice(0, 10).map((r, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Restaurant",
        "name": r.name,
        "url": `https://www.eatspot.nl/${city.slug}/${r.slug}`,
        "image": r.image_url || undefined,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": r.address,
          "addressLocality": city.name,
          "addressCountry": "NL"
        },
        ...(r.rating ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": Number(r.rating).toFixed(1),
            "reviewCount": r.review_count || 0,
            "bestRating": 5,
            "worstRating": 1
          }
        } : {})
      }
    }))
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.eatspot.nl/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Steden",
        "item": "https://www.eatspot.nl/ontdek"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city.name,
        "item": `https://www.eatspot.nl/${city.slug}`
      }
    ]
  };

  // FAQ JSON-LD for SEO
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Hoeveel restaurants zijn er in ${city.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Er zijn momenteel ${restaurants.length} restaurants geregistreerd in ${city.name}. Dit aantal wordt regelmatig bijgewerkt met nieuwe eetgelegenheden.`
        }
      },
      {
        "@type": "Question",
        "name": `Wat is de beste keuken in ${city.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": stats?.topCuisines && stats.topCuisines.length > 0 
            ? `De meest populaire keukens in ${city.name} zijn ${stats.topCuisines.slice(0, 3).join(', ')}.`
            : `${city.name} biedt een diverse mix van culinaire stijlen.`
        }
      },
      {
        "@type": "Question",
        "name": `Hoe vind ik het beste restaurant in ${city.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sorteer op "Beste beoordeling" om de hoogst beoordeelde restaurants te zien. Je kunt ook filteren op prijsklasse en keukentype.`
        }
      }
    ]
  };

  return (
    <Layout
      title={`Restaurants in ${city.name} - ${city.province}`}
      description={city.meta_description || `Ontdek de ${restaurants.length} beste restaurants in ${city.name}, ${city.province}. Lees reviews, bekijk foto's en vind jouw perfecte eetplek.`}
      image={city.image_url || undefined}
      jsonLd={[placeJsonLd, itemListJsonLd, breadcrumbJsonLd, faqJsonLd]}
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/ontdek" className="hover:text-foreground">Steden</Link>
            <span>/</span>
            <span className="text-foreground">{city.name}</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Restaurants in {city.name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{city.province}</span>
                <span>•</span>
                <span>{restaurants.length} restaurants gevonden</span>
              </div>
            </div>
          </div>

          {/* Dynamic intro text below H1 */}
          {dynamicContent && (
            <p className="mt-4 text-muted-foreground max-w-3xl">
              {dynamicContent.intro} {dynamicContent.cuisines} {dynamicContent.cta}
            </p>
          )}

          <div className="mt-6">
            <SearchBar className="max-w-2xl" />
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-8">
        <div className="container-wide">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge className="ml-2" variant="secondary">
                        {selectedPrices.length + selectedCuisines.length + (minRating ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-3">Prijsklasse</h3>
                      <div className="flex flex-wrap gap-2">
                        {priceRangeOptions.map((price) => (
                          <Button
                            key={price}
                            variant={selectedPrices.includes(price) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => togglePrice(price)}
                          >
                            {price}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <h3 className="font-medium mb-3">Minimale beoordeling</h3>
                      <div className="flex flex-wrap gap-2">
                        {[3, 3.5, 4, 4.5].map((rating) => (
                          <Button
                            key={rating}
                            variant={minRating === rating ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMinRating(minRating === rating ? undefined : rating)}
                          >
                            ⭐ {rating}+
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Cuisines */}
                    <div>
                      <h3 className="font-medium mb-3">Keukens</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {cuisines?.map((cuisine) => (
                          <label key={cuisine.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedCuisines.includes(cuisine.slug)}
                              onCheckedChange={(checked) => {
                                setSelectedCuisines(prev =>
                                  checked
                                    ? [...prev, cuisine.slug]
                                    : prev.filter(c => c !== cuisine.slug)
                                );
                              }}
                            />
                            <span className="text-sm">
                              {cuisine.icon} {cuisine.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <Button variant="outline" className="w-full" onClick={clearFilters}>
                        Filters wissen
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Quick price filters */}
              <div className="hidden md:flex gap-1">
                {priceRangeOptions.map((price) => (
                  <Button
                    key={price}
                    variant={selectedPrices.includes(price) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePrice(price)}
                  >
                    {price}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort & View */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sorteren op" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Beste beoordeling</SelectItem>
                  <SelectItem value="reviews">Meeste reviews</SelectItem>
                  <SelectItem value="name">Naam A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden md:flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {restaurantsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'
                : 'space-y-4'
            }>
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl font-medium">Geen restaurants gevonden</p>
              <p className="mt-2 text-muted-foreground">
                Probeer andere filters of zoek in een andere stad.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Filters wissen
                </Button>
              )}
            </div>
          )}

          {/* Advertisement Block */}
          <div className="mt-8">
            <AdBlock placementType="city" />
          </div>

          {/* Dynamic SEO Content Section */}
          {dynamicContent && restaurants.length > 0 && (
            <section className="mt-12 pt-8 border-t">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-display font-bold mb-6">
                  Uit eten in {city.name}
                </h2>

                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-secondary/30 rounded-lg p-4 text-center">
                      <Utensils className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
                      <div className="text-xs text-muted-foreground">Restaurants</div>
                    </div>
                    
                    <div className="bg-secondary/30 rounded-lg p-4 text-center">
                      <Star className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{stats.reviewedRestaurants}</div>
                      <div className="text-xs text-muted-foreground">Met reviews</div>
                    </div>
                    
                    {stats.avgRating && (
                      <div className="bg-secondary/30 rounded-lg p-4 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{stats.avgRating}</div>
                        <div className="text-xs text-muted-foreground">Gem. score</div>
                      </div>
                    )}
                    
                    {stats.topCuisines.length > 0 && (
                      <div className="bg-secondary/30 rounded-lg p-4 text-center">
                        <div className="text-lg mb-1">🍽️</div>
                        <div className="text-sm font-medium truncate">{stats.topCuisines[0]}</div>
                        <div className="text-xs text-muted-foreground">Populairste keuken</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Popular Cuisines */}
                {stats?.topCuisines && stats.topCuisines.length > 1 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-3">
                      Populaire keukens in {city.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.topCuisines.map((cuisine) => (
                        <Badge key={cuisine} variant="secondary" className="px-3 py-1">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Section for SEO */}
                <div className="mt-10">
                  <h3 className="text-lg font-semibold mb-4">
                    Veelgestelde vragen over restaurants in {city.name}
                  </h3>
                  <div className="space-y-4">
                    <details className="group bg-secondary/20 rounded-lg">
                      <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                        Hoeveel restaurants zijn er in {city.name}?
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <div className="px-4 pb-4 text-muted-foreground">
                        Er zijn momenteel {restaurants.length} restaurants geregistreerd in {city.name}. 
                        Dit aantal wordt regelmatig bijgewerkt met nieuwe eetgelegenheden.
                      </div>
                    </details>
                    
                    <details className="group bg-secondary/20 rounded-lg">
                      <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                        Wat is de beste keuken in {city.name}?
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <div className="px-4 pb-4 text-muted-foreground">
                        {stats?.topCuisines && stats.topCuisines.length > 0 
                          ? `De meest populaire keukens in ${city.name} zijn ${stats.topCuisines.slice(0, 3).join(', ')}. Gebruik de filters om restaurants per keuken te bekijken.`
                          : `${city.name} biedt een diverse mix van culinaire stijlen. Gebruik de filters om te zoeken op jouw favoriete keuken.`
                        }
                      </div>
                    </details>
                    
                    <details className="group bg-secondary/20 rounded-lg">
                      <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                        Hoe vind ik het beste restaurant in {city.name}?
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <div className="px-4 pb-4 text-muted-foreground">
                        Sorteer op "Beste beoordeling" om de hoogst beoordeelde restaurants te zien. 
                        Je kunt ook filteren op prijsklasse en keukentype om een restaurant te vinden dat bij jouw voorkeuren past.
                      </div>
                    </details>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-8">
                  {dynamicContent.updated}
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </Layout>
  );
}
