import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { City } from '@/types/database';

interface CityCardProps {
  city: City;
  restaurantCount?: number;
  className?: string;
}

// Default city images from Unsplash
const cityImages: Record<string, string> = {
  amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop',
  rotterdam: 'https://images.unsplash.com/photo-1543269664-76bc3997d9ea?w=400&h=300&fit=crop',
  'den-haag': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop',
  utrecht: 'https://images.unsplash.com/photo-1579616043939-66feae7e9df2?w=400&h=300&fit=crop',
  eindhoven: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  groningen: 'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=400&h=300&fit=crop',
  maastricht: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
};

export function CityCard({ city, restaurantCount, className }: CityCardProps) {
  const imageUrl = city.image_url || cityImages[city.slug] || cityImages.default;

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
