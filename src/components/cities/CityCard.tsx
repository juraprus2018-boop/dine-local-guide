import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { City } from '@/types/database';
import placeholderCity from '@/assets/placeholder-city.jpg';

interface CityCardProps {
  city: City;
  restaurantCount?: number;
  className?: string;
}

export function CityCard({ city, restaurantCount, className }: CityCardProps) {
  const imageUrl = city.image_url || placeholderCity;

  return (
    <Link to={`/${city.slug}`}>
      <Card className={cn('group overflow-hidden card-hover border-0 shadow-md', className)}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={city.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <CardContent className="absolute inset-0 flex flex-col justify-end p-4 text-white">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium opacity-80">{city.province}</span>
            </div>
            <h3 className="mt-1 font-display text-2xl font-semibold">
              {city.name}
            </h3>
            {restaurantCount !== undefined && (
              <p className="mt-1 text-sm opacity-80">
                {restaurantCount} restaurants
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
