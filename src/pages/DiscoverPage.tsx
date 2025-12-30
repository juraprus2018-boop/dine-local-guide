import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Layout } from '@/components/layout';
import { CityCard } from '@/components/cities/CityCard';
import { SearchBar } from '@/components/search/SearchBar';
import { useCities } from '@/hooks/useRestaurants';

export default function DiscoverPage() {
  const { data: cities, isLoading } = useCities();

  // Group cities by province
  const citiesByProvince = cities?.reduce((acc, city) => {
    const province = city.province || 'Overig';
    if (!acc[province]) acc[province] = [];
    acc[province].push(city);
    return acc;
  }, {} as Record<string, typeof cities>);

  return (
    <Layout
      title="Ontdek restaurants in Nederland"
      description="Vind de beste restaurants in alle steden van Nederland. Van Amsterdam tot Maastricht, ontdek waar je lekker kunt eten."
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container-wide">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Ontdek restaurants in Nederland
            </h1>
            <p className="mt-3 text-muted-foreground">
              Kies een stad en vind de beste eetgelegenheden bij jou in de buurt
            </p>
          </div>

          <div className="mt-6">
            <SearchBar className="max-w-2xl" />
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="py-8 md:py-12">
        <div className="container-wide">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
              ))}
            </div>
          ) : citiesByProvince ? (
            <div className="space-y-12">
              {Object.entries(citiesByProvince).map(([province, provinceCities]) => (
                <div key={province}>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-2xl font-semibold">{province}</h2>
                    <span className="text-muted-foreground">
                      ({provinceCities?.length} steden)
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {provinceCities?.map((city) => (
                      <CityCard key={city.id} city={city} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Geen steden gevonden</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
