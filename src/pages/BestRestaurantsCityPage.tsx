import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { MapPin, Trophy, Star, TrendingUp, Award } from 'lucide-react';
import NotFound from './NotFound';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCity, useRestaurants } from '@/hooks/useRestaurants';
import { useTrackPageView } from '@/hooks/usePageViews';

// Dynamic SEO content generator for "Beste Restaurants" pages
function generateBestRestaurantsContent(cityName: string, province: string, restaurantCount: number, topRestaurants: any[], topCuisines: string[], avgRating: string | null) {
  const currentMonth = new Date().toLocaleDateString('nl-NL', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const topRatedNames = topRestaurants.slice(0, 3).map(r => r.name);
  
  return {
    title: `Beste Restaurants in ${cityName}`,
    metaTitle: `Beste Restaurants ${cityName} ${currentYear} | Top ${Math.min(10, restaurantCount)} | Mijn Restaurant`,
    intro: `Op zoek naar het beste restaurant in ${cityName}? We hebben de hoogst beoordeelde restaurants in ${province} voor je op een rijtje gezet, gebaseerd op echte beoordelingen van bezoekers.`,
    metaDescription: `Ontdek de beste restaurants in ${cityName}. ${topRatedNames.length > 0 ? `Inclusief ${topRatedNames[0]}. ` : ''}Beoordeeld door echte bezoekers. ✓ Reviews ✓ Foto's ✓ Menu's`,
    h1: `De Beste Restaurants in ${cityName}`,
    
    paragraph1: topRatedNames.length > 0 
      ? `Koplopers in ${cityName} zijn onder andere ${topRatedNames.join(', ')}. Deze restaurants onderscheiden zich door uitstekende kwaliteit, geweldige service en een unieke sfeer.`
      : `${cityName} heeft een diverse selectie aan restaurants die uitblinken in kwaliteit en service.`,
    paragraph2: avgRating 
      ? `De top restaurants in ${cityName} hebben een indrukwekkende gemiddelde score van ${avgRating} sterren. Dit getuigt van de hoge standaard die lokale horecaondernemers hanteren.`
      : `De beste restaurants in ${cityName} worden gewaardeerd om hun consistente kwaliteit en uitstekende gastbeleving.`,
    paragraph3: topCuisines.length > 0 
      ? `Onder de best beoordeelde restaurants vind je diverse keukens, waaronder ${topCuisines.slice(0, 3).join(', ')}. Er is voor ieder wat wils!`
      : `Van lokale specialiteiten tot internationale gerechten - de toprestaurants van ${cityName} bieden een breed culinair palet.`,
    cta: `Ontdek hieronder onze top ${Math.min(10, restaurantCount)} restaurants en plan je volgende culinaire ervaring!`,
    updated: `Laatst bijgewerkt: ${currentMonth} ${currentYear}`,
    faq: [
      {
        question: `Wat is het beste restaurant in ${cityName}?`,
        answer: topRatedNames.length > 0 
          ? `Op basis van beoordelingen van bezoekers is ${topRatedNames[0]} momenteel het best beoordeelde restaurant in ${cityName}. Maar bekijk ook de andere toppers in onze lijst!`
          : `Bekijk onze ranglijst van best beoordeelde restaurants in ${cityName} om het perfecte restaurant voor jou te vinden.`
      },
      {
        question: `Hoe worden de beste restaurants in ${cityName} bepaald?`,
        answer: `Onze ranglijst is gebaseerd op beoordelingen van echte bezoekers. We kijken naar de gemiddelde score, het aantal reviews en de consistentie van de beoordelingen.`
      },
      {
        question: `Zijn er fine dining restaurants in ${cityName}?`,
        answer: `Ja, ${cityName} heeft verschillende restaurants in het hogere segment. Filter op prijsklasse (€€€ of €€€€) om fine dining opties te vinden.`
      },
      {
        question: `Waar kan ik de menu's van restaurants in ${cityName} bekijken?`,
        answer: `Op de detailpagina van elk restaurant vind je informatie over het menu, prijzen en specialiteiten. Klik op een restaurant voor meer details.`
      }
    ]
  };
}

export default function BestRestaurantsCityPage() {
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

  // Sort restaurants by rating (best first) - only those with reviews
  const sortedRestaurants = useMemo(() => {
    return [...restaurants]
      .filter(r => r.review_count && r.review_count > 0)
      .sort((a, b) => {
        // First by rating
        const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
        if (ratingDiff !== 0) return ratingDiff;
        // Then by review count
        return (b.review_count || 0) - (a.review_count || 0);
      });
  }, [restaurants]);

  // Calculate statistics for dynamic content
  const stats = useMemo(() => {
    if (!sortedRestaurants.length) return null;
    
    const avgRating = sortedRestaurants.length > 0 
      ? (sortedRestaurants.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0) / sortedRestaurants.length).toFixed(1)
      : null;
    
    // Get top cuisines from restaurants
    const cuisineCounts: Record<string, number> = {};
    sortedRestaurants.forEach((r: any) => {
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
      totalRestaurants: sortedRestaurants.length,
      avgRating,
      topCuisines,
    };
  }, [sortedRestaurants]);

  // Generate dynamic SEO content
  const content = useMemo(() => {
    if (!city) return null;
    return generateBestRestaurantsContent(
      city.name, 
      city.province || 'Nederland', 
      sortedRestaurants.length,
      sortedRestaurants.slice(0, 5),
      stats?.topCuisines || [],
      stats?.avgRating || null
    );
  }, [city, sortedRestaurants, stats]);

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
      "url": `https://www.mijn-restaurant.nl/beste-restaurants/${city.slug}`,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mijn-restaurant.nl" },
          { "@type": "ListItem", "position": 2, "name": "Beste Restaurants", "item": "https://www.mijn-restaurant.nl/beste-restaurants" },
          { "@type": "ListItem", "position": 3, "name": `Beste Restaurants ${city.name}`, "item": `https://www.mijn-restaurant.nl/beste-restaurants/${city.slug}` }
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
      "name": `Beste restaurants in ${city.name}`,
      "description": `Top ${sortedRestaurants.length} best beoordeelde restaurants in ${city.name}`,
      "numberOfItems": sortedRestaurants.length,
      "itemListElement": sortedRestaurants.slice(0, 10).map((r, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Restaurant",
          "name": r.name,
          "url": `https://www.mijn-restaurant.nl/${city.slug}/${r.slug}`,
          ...(r.rating && r.review_count && r.review_count > 0
            ? {
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": r.rating,
                  "reviewCount": r.review_count,
                  "bestRating": 5,
                },
              }
            : {})
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
      <section className="bg-gradient-to-br from-yellow-500/10 via-background to-orange-500/10 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>Beste Restaurants</span>
            <span>/</span>
            <span className="text-foreground">{city.name}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            <Trophy className="inline-block mr-3 h-8 w-8 md:h-10 md:w-10 text-yellow-500" />
            {content.h1}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city.province}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
              <Award className="h-3 w-3" />
              Top {sortedRestaurants.length}
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
                <h2 className="text-xl font-semibold mb-4">De toprestaurants van {city.name}</h2>
                <p className="text-muted-foreground mb-4">{content.paragraph1}</p>
                <p className="text-muted-foreground mb-4">{content.paragraph2}</p>
                <p className="text-muted-foreground">{content.paragraph3}</p>
              </div>

              {/* Top 3 Highlight */}
              {sortedRestaurants.length >= 3 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top 3 Restaurants
                  </h2>
                  <div className="space-y-4">
                    {sortedRestaurants.slice(0, 3).map((restaurant, index) => (
                      <Link 
                        key={restaurant.id}
                        to={`/${city.slug}/${restaurant.slug}`}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{Number(restaurant.rating).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">({restaurant.review_count})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurant Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Alle toprestaurants</h2>
                  <Link to={`/${city.slug}`}>
                    <Button variant="outline" size="sm">
                      Bekijk alle restaurants
                    </Button>
                  </Link>
                </div>
                
                {restaurantsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 skeleton rounded-xl" />
                    ))}
                  </div>
                ) : sortedRestaurants.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nog geen beoordelingen</h3>
                    <p className="text-muted-foreground mb-4">
                      Er zijn nog geen restaurants met beoordelingen in {city.name}.
                    </p>
                    <Link to={`/${city.slug}`}>
                      <Button>Bekijk alle restaurants</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedRestaurants.slice(0, 10).map((restaurant, index) => (
                      <div key={restaurant.id} className="relative">
                        {index < 3 && (
                          <div className={`absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                          }`}>
                            #{index + 1}
                          </div>
                        )}
                        <RestaurantCard 
                          restaurant={restaurant} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-4">Statistieken</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{sortedRestaurants.length}</p>
                      <p className="text-sm text-muted-foreground">Beoordeelde restaurants</p>
                    </div>
                  </div>
                  {stats?.avgRating && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium">{stats.avgRating} / 5</p>
                        <p className="text-sm text-muted-foreground">Gem. score top restaurants</p>
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
                    to={`/uiteten-in/${city.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">Uit Eten</p>
                    <p className="text-sm text-muted-foreground">Tips voor uit eten gaan</p>
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
          <h2 className="text-2xl font-bold mb-8 text-center">Veelgestelde vragen over de beste restaurants in {city.name}</h2>
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
