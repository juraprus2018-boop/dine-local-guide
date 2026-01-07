import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { MapPin, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
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

  return (
    <Layout
      title={`Restaurants in ${city.name} - ${city.province}`}
      description={city.meta_description || `Ontdek de ${restaurants.length} beste restaurants in ${city.name}, ${city.province}. Lees reviews, bekijk foto's en vind jouw perfecte eetplek.`}
      image={city.image_url || undefined}
      jsonLd={[placeJsonLd, itemListJsonLd, breadcrumbJsonLd]}
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
                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
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
        </div>
      </section>
    </Layout>
  );
}
