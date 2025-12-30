import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout';
import { useCities } from '@/hooks/useRestaurants';

// Dutch provinces with their regions
const PROVINCES = [
  { name: 'Drenthe', slug: 'drenthe' },
  { name: 'Flevoland', slug: 'flevoland' },
  { name: 'Friesland', slug: 'friesland' },
  { name: 'Gelderland', slug: 'gelderland' },
  { name: 'Groningen', slug: 'groningen' },
  { name: 'Limburg', slug: 'limburg' },
  { name: 'Noord-Brabant', slug: 'noord-brabant' },
  { name: 'Noord-Holland', slug: 'noord-holland' },
  { name: 'Overijssel', slug: 'overijssel' },
  { name: 'Utrecht', slug: 'utrecht' },
  { name: 'Zeeland', slug: 'zeeland' },
  { name: 'Zuid-Holland', slug: 'zuid-holland' },
];

export default function ProvincesPage() {
  const { data: cities, isLoading } = useCities();

  // Group cities by province
  const citiesByProvince = cities?.reduce((acc, city) => {
    const province = city.province || 'Overig';
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(city);
    return acc;
  }, {} as Record<string, typeof cities>);

  // Get provinces that have cities
  const provincesWithCities = PROVINCES.filter(
    (p) => citiesByProvince?.[p.name]?.length
  );

  // Provinces without cities yet
  const emptyProvinces = PROVINCES.filter(
    (p) => !citiesByProvince?.[p.name]?.length
  );

  return (
    <Layout
      title="Provincies - Ontdek restaurants per regio"
      description="Vind de beste restaurants in alle Nederlandse provincies. Van Noord-Holland tot Limburg."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-2xl">
            <h1 className="animate-fade-in">
              Ontdek per provincie
            </h1>
            <p className="mt-4 text-muted-foreground animate-slide-up">
              Vind de beste restaurants in jouw regio. Selecteer een provincie om alle steden en restaurants te bekijken.
            </p>
          </div>
        </div>
      </section>

      {/* Provinces with Cities */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {provincesWithCities.map((province) => {
                const provinceCities = citiesByProvince?.[province.name] || [];
                return (
                  <div
                    key={province.slug}
                    className="bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="bg-primary/5 border-b px-6 py-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {province.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provinceCities.length} {provinceCities.length === 1 ? 'stad' : 'steden'}
                      </p>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-1">
                        {provinceCities.slice(0, 8).map((city) => (
                          <li key={city.id}>
                            <Link
                              to={`/${city.slug}`}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary transition-colors group"
                            >
                              <span className="font-medium">{city.name}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                          </li>
                        ))}
                        {provinceCities.length > 8 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">
                            +{provinceCities.length - 8} meer steden
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Coming Soon Provinces */}
          {emptyProvinces.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-6">Binnenkort beschikbaar</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {emptyProvinces.map((province) => (
                  <div
                    key={province.slug}
                    className="bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-3 opacity-60"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{province.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container-wide text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Mis jouw stad of restaurant?
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            We breiden continu uit. Laat ons weten welke stad of welk restaurant je graag zou willen zien!
          </p>
        </div>
      </section>
    </Layout>
  );
}
