import { Link } from 'react-router-dom';
import { Star, MapPin, Award, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types/database';
import placeholderRestaurant from '@/assets/placeholder-restaurant.jpg';

interface FeaturedRestaurantCardProps {
  restaurant: Restaurant;
  rank: number;
  className?: string;
}

export function FeaturedRestaurantCard({ restaurant, rank, className }: FeaturedRestaurantCardProps) {
  const citySlug = restaurant.city?.slug || 'nederland';
  const imageUrl = restaurant.image_url || placeholderRestaurant;

  return (
    <Link 
      to={`/${citySlug}/${restaurant.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-3xl bg-card shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2',
        rank === 1 && 'md:col-span-2 md:row-span-2',
        className
      )}
    >
      <div className={cn(
        'relative overflow-hidden',
        rank === 1 ? 'aspect-[4/3] md:aspect-[16/10]' : 'aspect-[4/3]'
      )}>
        <img
          src={imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Rank badge */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-lg',
            rank === 1 
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' 
              : rank === 2 
                ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                : rank === 3
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                  : 'bg-white/90 text-foreground'
          )}>
            {rank <= 3 && <Award className="h-4 w-4" />}
            #{rank}
          </div>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
          {/* Cuisines */}
          {restaurant.cuisines && restaurant.cuisines.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.cuisines.slice(0, 2).map((cuisine) => (
                <Badge
                  key={cuisine.id}
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs"
                >
                  {cuisine.icon} {cuisine.name}
                </Badge>
              ))}
            </div>
          )}

          <h3 className={cn(
            'font-display font-bold tracking-tight',
            rank === 1 ? 'text-2xl md:text-3xl' : 'text-xl'
          )}>
            {restaurant.name}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{restaurant.city?.name || 'Nederland'}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-semibold">{Number(restaurant.rating).toFixed(1)}</span>
              </div>
              <span className="text-sm text-white/70">
                ({restaurant.review_count?.toLocaleString('nl-NL')} reviews)
              </span>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Bekijk
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
