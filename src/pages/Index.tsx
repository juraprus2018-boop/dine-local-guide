import { Layout } from '@/components/layout';
import { HeroSection } from '@/components/home/HeroSection';
import { PopularCitiesSection } from '@/components/home/PopularCitiesSection';
import { TopRatedSection } from '@/components/home/TopRatedSection';
import { CuisinesSection } from '@/components/home/CuisinesSection';
import { CTASection } from '@/components/home/CTASection';
import { AdBlock } from '@/components/ads/AdBlock';
import { useCuisines, useRestaurants } from '@/hooks/useRestaurants';
import { usePopularCities } from '@/hooks/usePopularCities';
import { useTrackPageView } from '@/hooks/usePageViews';

export default function Index() {
  // Track page view
  useTrackPageView({ pageType: 'home' });

  const { data: popularCities, isLoading: citiesLoading } = usePopularCities(6);
  const { data: cuisines, isLoading: cuisinesLoading } = useCuisines();
  
  // Only fetch restaurants that have actual reviews (minReviews: 1)
  const { data: topRatedData, isLoading: restaurantsLoading } = useRestaurants({ 
    sortBy: 'rating',
    minReviews: 1,
    limit: 5 
  });

  const topRestaurants = topRatedData?.restaurants || [];
  const featuredCuisines = cuisines?.slice(0, 12) || [];
  
  // Calculate stats
  const totalRestaurants = 10000; // Could be fetched dynamically
  const totalReviews = 0; // Only count real website reviews, not Google scores
  const totalCities = popularCities?.length ? Math.max(popularCities.length, 150) : 150;

  // Homepage JSON-LD
  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Eatspot - Ontdek de beste restaurants in Nederland",
    "description": "Vind en ontdek de beste restaurants, cafés en eetgelegenheden in jouw stad.",
    "url": "https://www.eatspot.nl/",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Populaire restaurants",
      "numberOfItems": topRestaurants.length,
      "itemListElement": topRestaurants.slice(0, 5).map((r, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Restaurant",
          "name": r.name,
          "aggregateRating": r.rating ? {
            "@type": "AggregateRating",
            "ratingValue": Number(r.rating).toFixed(1),
            "reviewCount": r.review_count
          } : undefined
        }
      }))
    }
  };

  return (
    <Layout
      title="Ontdek de beste restaurants in Nederland"
      description="Vind en ontdek de beste restaurants, cafés en eetgelegenheden in jouw stad. Lees reviews, bekijk foto's en vind jouw perfecte eetplek met Eatspot."
      jsonLd={homepageJsonLd}
    >
      <HeroSection 
        restaurantCount={totalRestaurants}
        reviewCount={totalReviews}
        cityCount={totalCities}
      />

      <PopularCitiesSection 
        cities={popularCities || []}
        isLoading={citiesLoading}
      />

      <TopRatedSection 
        restaurants={topRestaurants}
        isLoading={restaurantsLoading}
      />

      <CuisinesSection 
        cuisines={featuredCuisines}
        isLoading={cuisinesLoading}
      />

      {/* Advertisement Block */}
      <section className="py-8">
        <div className="container-wide">
          <AdBlock placementType="homepage" />
        </div>
      </section>

      <CTASection />
    </Layout>
  );
}
