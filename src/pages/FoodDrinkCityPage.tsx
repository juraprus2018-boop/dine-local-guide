import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { MapPin, UtensilsCrossed, Star, Wine, Coffee, Soup } from 'lucide-react';
import NotFound from './NotFound';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCity, useRestaurants } from '@/hooks/useRestaurants';
import { useTrackPageView } from '@/hooks/usePageViews';

// Dynamic SEO content generator for "Eten en Drinken" pages
function generateFoodDrinkContent(cityName: string, province: string, restaurantCount: number, topCuisines: string[], avgRating: string | null, priceDistribution: Record<string, number>) {
  const currentMonth = new Date().toLocaleDateString('nl-NL', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const hasVariety = Object.keys(priceDistribution).length >= 3;
  
  return {
    title: `Eten en Drinken in ${cityName}`,
    metaTitle: `Eten en Drinken in ${cityName} | Restaurants, Cafés & Bars | Mijn Restaurant`,
    metaDescription: `Complete gids voor eten en drinken in ${cityName}. ${restaurantCount}+ horecazaken: restaurants, cafés, bars en meer. Ontdek waar je moet zijn!`,
    h1: `Eten en Drinken in ${cityName}`,
    intro: `Welkom bij de ultieme gids voor eten en drinken in ${cityName}! Of je nu op zoek bent naar een uitgebreid diner, een gezellige lunch, een kopje koffie of een avond aan de bar - ${cityName} heeft het allemaal.`,
    paragraph1: `Met meer dan ${restaurantCount} horecagelegenheden is ${cityName} een echte culinaire bestemming in ${province}. ${hasVariety ? 'Van budget-vriendelijke eetcafés tot exclusieve fine dining - er is voor elk budget wat te vinden.' : 'De lokale horeca biedt een diverse mix van eetgelegenheden.'}`,
    paragraph2: topCuisines.length > 0 
      ? `De culinaire scene in ${cityName} wordt gedomineerd door ${topCuisines.slice(0, 3).join(', ')}. Maar er is nog veel meer te ontdekken! Elk restaurant heeft zijn eigen unieke karakter en specialiteiten.`
      : `${cityName} biedt een rijke mix aan culinaire stijlen, van traditioneel Nederlands tot internationale keukens.`,
    paragraph3: avgRating 
      ? `De horecazaken in ${cityName} scoren gemiddeld ${avgRating} sterren bij onze bezoekers. Dit getuigt van de hoge kwaliteit en gastvrijheid die je hier kunt verwachten.`
      : `Ontdek zelf de gastvrijheid en kwaliteit van de horeca in ${cityName}. Lees reviews en beoordelingen van andere bezoekers.`,
    sections: {
      restaurants: `${cityName} telt diverse restaurants, van intieme bistro's tot grote eetgelegenheden. Perfect voor een uitgebreide maaltijd met vrienden, familie of zakenrelaties.`,
      cafes: `Voor een snelle lunch of kopje koffie zijn er talloze cafés en lunchrooms in ${cityName}. Ideaal voor een tussenstop tijdens het shoppen of een informele afspraak.`,
      bars: `Het nachtleven van ${cityName} biedt genoeg opties voor een drankje. Van bruine kroegen tot trendy cocktailbars - er is voor elk wat wils.`,
    },
    cta: `Verken hieronder de beste eet- en drinkgelegenheden van ${cityName} en plan je volgende culinaire avontuur!`,
    updated: `Laatst bijgewerkt: ${currentMonth} ${currentYear}`,
    faq: [
      {
        question: `Wat zijn de beste plekken om te eten in ${cityName}?`,
        answer: `${cityName} heeft meer dan ${restaurantCount} eetgelegenheden. ${topCuisines.length > 0 ? `Populaire keukens zijn ${topCuisines.slice(0, 3).join(', ')}.` : ''} Bekijk onze selectie en filter op jouw voorkeuren.`
      },
      {
        question: `Zijn er vegetarische restaurants in ${cityName}?`,
        answer: `Ja, veel restaurants in ${cityName} bieden vegetarische en veganistische opties. Sommige zijn zelfs volledig plantaardig. Check de menu's voor specifieke opties.`
      },
      {
        question: `Waar kan ik ontbijten of brunchen in ${cityName}?`,
        answer: `${cityName} heeft diverse cafés en restaurants die ontbijt en brunch serveren. Bekijk de openingstijden per locatie om te zien wat wanneer open is.`
      },
      {
        question: `Zijn er glutenvrije opties in ${cityName}?`,
        answer: `Steeds meer restaurants in ${cityName} bieden glutenvrije alternatieven aan. Neem bij twijfel contact op met het restaurant voor specifieke dieetwensen.`
      },
      {
        question: `Kan ik met kinderen eten in ${cityName}?`,
        answer: `Veel restaurants in ${cityName} zijn kindvriendelijk en hebben kindermenu's of kinderstoelen. Check de details per restaurant voor specifieke faciliteiten.`
      }
    ]
  };
}

export default function FoodDrinkCityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();

  const { data: city, isLoading: cityLoading } = useCity(citySlug || '');
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

    // Price distribution
    const priceDistribution: Record<string, number> = {};
    restaurants.forEach((r: any) => {
      if (r.price_range) {
        priceDistribution[r.price_range] = (priceDistribution[r.price_range] || 0) + 1;
      }
    });
    
    return {
      totalRestaurants: restaurants.length,
      reviewedRestaurants: withReviews.length,
      avgRating,
      topCuisines,
      priceDistribution,
    };
  }, [restaurants]);

  // Generate dynamic SEO content
  const content = useMemo(() => {
    if (!city) return null;
    return generateFoodDrinkContent(
      city.name, 
      city.province || 'Nederland', 
      restaurants.length,
      stats?.topCuisines || [],
      stats?.avgRating || null,
      stats?.priceDistribution || {}
    );
  }, [city, restaurants.length, stats]);

  // Sort restaurants by review count and rating
  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => {
      if ((b.review_count || 0) !== (a.review_count || 0)) {
        return (b.review_count || 0) - (a.review_count || 0);
      }
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
      "url": `https://www.mijn-restaurant.nl/eten-en-drinken/${city.slug}`,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mijn-restaurant.nl" },
          { "@type": "ListItem", "position": 2, "name": "Eten en Drinken", "item": "https://www.mijn-restaurant.nl/eten-en-drinken" },
          { "@type": "ListItem", "position": 3, "name": `Eten en Drinken in ${city.name}`, "item": `https://www.mijn-restaurant.nl/eten-en-drinken/${city.slug}` }
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
      "name": `Eten en drinken in ${city.name}`,
      "numberOfItems": restaurants.length,
      "itemListElement": sortedRestaurants.slice(0, 10).map((r, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "FoodEstablishment",
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
      <section className="bg-gradient-to-br from-green-500/10 via-background to-amber-500/10 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>Eten en Drinken</span>
            <span>/</span>
            <span className="text-foreground">{city.name}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            <UtensilsCrossed className="inline-block mr-3 h-8 w-8 md:h-10 md:w-10 text-green-600" />
            {content.h1}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city.province}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {restaurants.length} locaties
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
                <h2 className="text-xl font-semibold mb-4">De horecascene van {city.name}</h2>
                <p className="text-muted-foreground mb-4">{content.paragraph1}</p>
                <p className="text-muted-foreground mb-4">{content.paragraph2}</p>
                <p className="text-muted-foreground">{content.paragraph3}</p>
              </div>

              {/* Category Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-5 shadow-sm border">
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                    <Soup className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Restaurants</h3>
                  <p className="text-sm text-muted-foreground">{content.sections.restaurants}</p>
                </div>
                <div className="bg-card rounded-xl p-5 shadow-sm border">
                  <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                    <Coffee className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Cafés & Lunchrooms</h3>
                  <p className="text-sm text-muted-foreground">{content.sections.cafes}</p>
                </div>
                <div className="bg-card rounded-xl p-5 shadow-sm border">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <Wine className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Bars & Kroegen</h3>
                  <p className="text-sm text-muted-foreground">{content.sections.bars}</p>
                </div>
              </div>

              {/* Restaurant Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Populaire locaties</h2>
                  <Link to={`/${city.slug}`}>
                    <Button variant="outline" size="sm">
                      Alle {restaurants.length} locaties
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
                <h3 className="font-semibold mb-4">Horeca in cijfers</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{restaurants.length}</p>
                      <p className="text-sm text-muted-foreground">Horecazaken</p>
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
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Soup className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{stats.topCuisines.length}+</p>
                        <p className="text-sm text-muted-foreground">Verschillende keukens</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Distribution */}
              {stats?.priceDistribution && Object.keys(stats.priceDistribution).length > 0 && (
                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-4">Prijsklassen</h3>
                  <div className="space-y-2">
                    {['€', '€€', '€€€', '€€€€'].map((price) => {
                      const count = stats.priceDistribution[price] || 0;
                      const percentage = restaurants.length > 0 ? (count / restaurants.length) * 100 : 0;
                      return (
                        <div key={price} className="flex items-center gap-2">
                          <span className="w-12 text-sm font-medium">{price}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                <h3 className="font-semibold mb-4">Ontdek meer</h3>
                <div className="space-y-2">
                  <Link 
                    to={`/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Alle restaurants</p>
                    <p className="text-sm text-muted-foreground">Bekijk alle {restaurants.length} locaties</p>
                  </Link>
                  <Link 
                    to={`/uiteten-in/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Uit Eten</p>
                    <p className="text-sm text-muted-foreground">Tips voor een avondje uit</p>
                  </Link>
                  <Link 
                    to={`/beste-restaurants/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Beste Restaurants</p>
                    <p className="text-sm text-muted-foreground">Top beoordeelde locaties</p>
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
          <h2 className="text-2xl font-bold mb-8 text-center">Veelgestelde vragen over eten en drinken in {city.name}</h2>
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
