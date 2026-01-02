import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeaturedRestaurantCard } from './FeaturedRestaurantCard';
import type { Restaurant } from '@/types/database';

interface TopRatedSectionProps {
  restaurants: Restaurant[];
  isLoading: boolean;
}

export function TopRatedSection({ restaurants, isLoading }: TopRatedSectionProps) {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 to-background">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-wider mb-2">
              <Trophy className="h-4 w-4" />
              Community favorites
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Top beoordeeld
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              De hoogst gewaardeerde restaurants volgens duizenden reviews
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex group">
            <Link to="/ontdek">
              Bekijk alles
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            <div className="skeleton rounded-3xl aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-[16/10]" />
            <div className="skeleton rounded-3xl aspect-[4/3]" />
            <div className="skeleton rounded-3xl aspect-[4/3]" />
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            {restaurants.slice(0, 5).map((restaurant, index) => (
              <FeaturedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl bg-muted/50">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-medium">Nog geen beoordeelde restaurants</p>
            <p className="mt-2 text-muted-foreground">
              Wees de eerste die een review achterlaat!
            </p>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/ontdek">
              Bekijk alle restaurants
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
