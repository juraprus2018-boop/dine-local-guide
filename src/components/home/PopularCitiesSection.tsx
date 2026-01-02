import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CityWithCount {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  image_url: string | null;
  restaurant_count: number;
}

interface PopularCitiesSectionProps {
  cities: CityWithCount[];
  isLoading: boolean;
}

// Default city images
const cityImages: Record<string, string> = {
  amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop',
  rotterdam: 'https://images.unsplash.com/photo-1543269664-76bc3997d9ea?w=600&h=400&fit=crop',
  'den-haag': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&h=400&fit=crop',
  utrecht: 'https://images.unsplash.com/photo-1579616043939-66feae7e9df2?w=600&h=400&fit=crop',
  eindhoven: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  groningen: 'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
};

export function PopularCitiesSection({ cities, isLoading }: PopularCitiesSectionProps) {
  if (!isLoading && cities.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2 block">
              Ontdek Nederland
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Populaire steden
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Verken restaurants in de meest culinaire steden van Nederland
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex group">
            <Link to="/ontdek">
              Alle steden
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  'skeleton rounded-2xl',
                  i === 0 ? 'aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-[16/10]' : 'aspect-[4/3]'
                )} 
              />
            ))
          ) : (
            cities.map((city, index) => {
              const imageUrl = city.image_url || cityImages[city.slug] || cityImages.default;
              const isFirst = index === 0;
              
              return (
                <Link
                  key={city.id}
                  to={`/${city.slug}`}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
                    isFirst && 'md:col-span-2 md:row-span-2'
                  )}
                >
                  <div className={cn(
                    'relative overflow-hidden',
                    isFirst ? 'aspect-[4/3] md:aspect-[16/10]' : 'aspect-[4/3]'
                  )}>
                    <img
                      src={imageUrl}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 text-white">
                      <div className="flex items-center gap-1.5 text-sm text-white/80">
                        <MapPin className="h-4 w-4" />
                        <span>{city.province}</span>
                      </div>
                      <h3 className={cn(
                        'mt-1 font-display font-bold tracking-tight',
                        isFirst ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'
                      )}>
                        {city.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/70">
                        {city.restaurant_count} restaurants
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/ontdek">
              Alle steden bekijken
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
