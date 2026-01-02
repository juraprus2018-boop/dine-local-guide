import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CuisineType } from '@/types/database';

interface CuisinesSectionProps {
  cuisines: CuisineType[];
  isLoading: boolean;
}

export function CuisinesSection({ cuisines, isLoading }: CuisinesSectionProps) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-wide">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2 block">
            Smaak ontdekken
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Welke keuken zoek je?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Van Italiaans tot Indonesisch — ontdek alle smaken van Nederland
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {isLoading ? (
            [...Array(12)].map((_, i) => (
              <div key={i} className="h-12 w-32 skeleton rounded-full" />
            ))
          ) : (
            cuisines.map((cuisine, index) => (
              <Link
                key={cuisine.id}
                to={`/keukens/${cuisine.slug}`}
                className={cn(
                  'group flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card shadow-sm',
                  'transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5',
                  'text-sm font-medium'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-lg">{cuisine.icon}</span>
                <span className="group-hover:text-primary transition-colors">{cuisine.name}</span>
              </Link>
            ))
          )}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" asChild className="group">
            <Link to="/keukens">
              Alle keukens bekijken
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
