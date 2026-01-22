import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { MapPin, Utensils, Star, Clock, Euro } from 'lucide-react';
import NotFound from './NotFound';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCity, useRestaurants, useCuisines } from '@/hooks/useRestaurants';
import { useTrackPageView } from '@/hooks/usePageViews';

// Dynamic SEO content generator for "Uit eten" pages
function generateEatingOutContent(cityName: string, province: string, restaurantCount: number, topCuisines: string[], avgRating: string | null) {
  const currentMonth = new Date().toLocaleDateString('nl-NL', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  return {
    title: `Uit Eten in ${cityName}`,
    metaTitle: `Uit Eten in ${cityName} | ${restaurantCount}+ Restaurants | Mijn Restaurant`,
    metaDescription: `Uit eten in ${cityName}? Ontdek ${restaurantCount}+ restaurants. Van romantisch diner tot gezellig lunchen. Bekijk reviews, foto's en boek direct!`,
    h1: `Uit Eten in ${cityName}`,
    intro: `Ben je op zoek naar een leuke plek om uit eten te gaan in ${cityName}? Je bent hier aan het juiste adres! ${cityName}, gelegen in ${province}, heeft een bruisende horecascene met meer dan ${restaurantCount} eetgelegenheden.`,
    paragraph1: topCuisines.length > 0 
      ? `Of je nu zin hebt in ${topCuisines.slice(0, 2).join(' of ')}, een romantisch diner of gewoon een gezellige avond uit - ${cityName} biedt voor ieder wat wils. De lokale restaurants staan bekend om hun gastvrijheid en kwaliteit.`
      : `Of je nu zin hebt in een romantisch diner, een gezellige avond met vrienden of een zakenlunch - ${cityName} biedt voor ieder wat wils.`,
    paragraph2: avgRating 
      ? `Met een gemiddelde beoordeling van ${avgRating} sterren zijn de restaurants in ${cityName} een echte aanrader. Onze bezoekers waarderen vooral de kwaliteit van het eten en de sfeer.`
      : `Ontdek zelf waarom zo veel mensen graag uit eten gaan in ${cityName}. Lees reviews van andere bezoekers en vind jouw perfecte restaurant.`,
    cta: `Bekijk hieronder onze selectie van de beste restaurants in ${cityName} en plan je volgende avondje uit!`,
    updated: `Laatst bijgewerkt: ${currentMonth} ${currentYear}`,
    faq: [
      {
        question: `Wat zijn de beste restaurants om uit eten te gaan in ${cityName}?`,
        answer: `In ${cityName} vind je meer dan ${restaurantCount} restaurants. ${topCuisines.length > 0 ? `Populaire keukens zijn ${topCuisines.slice(0, 3).join(', ')}.` : ''} Bekijk onze reviews en beoordelingen om het perfecte restaurant te vinden.`
      },
      {
        question: `Hoeveel kost uit eten in ${cityName}?`,
        answer: `De prijzen variëren van budget-vriendelijke eetcafés (€) tot fine dining restaurants (€€€€). Gebruik onze filters om restaurants in jouw prijsklasse te vinden.`
      },
      {
        question: `Welke keukens zijn populair in ${cityName}?`,
        answer: topCuisines.length > 0 
          ? `De meest populaire keukens in ${cityName} zijn ${topCuisines.join(', ')}. Maar er is nog veel meer te ontdekken!`
          : `${cityName} biedt een diverse mix van keukens, van lokaal Nederlands tot internationale gerechten.`
      },
      {
        question: `Kan ik ook lunchen in ${cityName}?`,
        answer: `Ja, veel restaurants in ${cityName} serveren lunch. Bekijk de openingstijden per restaurant om te zien welke gelegenheden overdag open zijn.`
      }
    ]
  };
}

export default function EatingOutCityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();

  const { data: city, isLoading: cityLoading } = useCity(citySlug || '');
  const { data: cuisines } = useCuisines();
  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    citySlug,
    sortBy: 'rating',
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
  const content = useMemo(() => {
    if (!city) return null;
    return generateEatingOutContent(
      city.name, 
      city.province || 'Nederland', 
      restaurants.length,
      stats?.topCuisines || [],
      stats?.avgRating || null
    );
  }, [city, restaurants.length, stats]);

  // Sort restaurants by rating, showing reviewed ones first
  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => {
      // First sort by review count (reviewed restaurants first)
      if ((b.review_count || 0) !== (a.review_count || 0)) {
        return (b.review_count || 0) - (a.review_count || 0);
      }
      // Then by rating
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });
  }, [restaurants]);

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

  if (!content) {
    return <NotFound />;
  }

  // JSON-LD structured data
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": content.metaTitle,
      "description": content.metaDescription,
      "url": `https://www.mijn-restaurant.nl/uiteten-in/${city.slug}`,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mijn-restaurant.nl" },
          { "@type": "ListItem", "position": 2, "name": "Uit Eten", "item": "https://www.mijn-restaurant.nl/uiteten-in" },
          { "@type": "ListItem", "position": 3, "name": `Uit Eten in ${city.name}`, "item": `https://www.mijn-restaurant.nl/uiteten-in/${city.slug}` }
        ]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": content.faq.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Restaurants om uit eten te gaan in ${city.name}`,
      "numberOfItems": restaurants.length,
      "itemListElement": sortedRestaurants.slice(0, 10).map((r, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Restaurant",
          "name": r.name,
          "url": `https://www.mijn-restaurant.nl/${city.slug}/${r.slug}`,
          ...(r.rating && { "aggregateRating": { "@type": "AggregateRating", "ratingValue": r.rating, "reviewCount": r.review_count || 1 } })
        }
      }))
    }
  ];

  return (
    <Layout 
      title={content.metaTitle}
      description={content.metaDescription}
      type="website"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>Uit Eten</span>
            <span>/</span>
            <span className="text-foreground">{city.name}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            <Utensils className="inline-block mr-3 h-8 w-8 md:h-10 md:w-10 text-primary" />
            {content.h1}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city.province}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              {restaurants.length} restaurants
            </Badge>
            {stats?.avgRating && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Gem. {stats.avgRating}
              </Badge>
            )}
          </div>

          <div className="prose prose-lg max-w-4xl text-muted-foreground">
            <p className="lead">{content.intro}</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Waarom uit eten in {city.name}?</h2>
                <p className="text-muted-foreground mb-4">{content.paragraph1}</p>
                <p className="text-muted-foreground mb-4">{content.paragraph2}</p>
                <p className="text-muted-foreground">{content.cta}</p>
              </div>

              {/* Restaurant Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Populaire restaurants</h2>
                  <Link to={`/${city.slug}`}>
                    <Button variant="outline" size="sm">
                      Alle {restaurants.length} restaurants
                    </Button>
                  </Link>
                </div>
                
                {restaurantsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 skeleton rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedRestaurants.slice(0, 6).map((restaurant) => (
                      <RestaurantCard 
                        key={restaurant.id} 
                        restaurant={restaurant} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-4">Quick Facts</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{restaurants.length}</p>
                      <p className="text-sm text-muted-foreground">Restaurants</p>
                    </div>
                  </div>
                  {stats?.avgRating && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium">{stats.avgRating} / 5</p>
                        <p className="text-sm text-muted-foreground">Gem. beoordeling</p>
                      </div>
                    </div>
                  )}
                  {stats?.topCuisines && stats.topCuisines.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Euro className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{stats.topCuisines[0]}</p>
                        <p className="text-sm text-muted-foreground">Populairste keuken</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Cuisines */}
              {stats?.topCuisines && stats.topCuisines.length > 0 && (
                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-4">Populaire keukens</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.topCuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary">{cuisine}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Links */}
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-4">Meer in {city.name}</h3>
                <div className="space-y-2">
                  <Link 
                    to={`/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Alle restaurants</p>
                    <p className="text-sm text-muted-foreground">Bekijk alle {restaurants.length} restaurants</p>
                  </Link>
                  <Link 
                    to={`/beste-restaurants/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Beste restaurants</p>
                    <p className="text-sm text-muted-foreground">Top beoordeelde eetgelegenheden</p>
                  </Link>
                  <Link 
                    to={`/eten-en-drinken/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Eten & Drinken</p>
                    <p className="text-sm text-muted-foreground">Complete horecagids</p>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-background">
        <div className="container-wide max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Veelgestelde vragen over uit eten in {city.name}</h2>
          <div className="space-y-4">
            {content.faq.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">{content.updated}</p>
        </div>
      </section>
    </Layout>
  );
}
