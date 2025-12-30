import { Link } from 'react-router-dom';
import { Star, MapPin, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToggleFavorite, useIsFavorite } from '@/hooks/useRestaurants';
import { cn } from '@/lib/utils';
import type { Restaurant, PriceRange } from '@/types/database';

interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

function PriceIndicator({ price }: { price: PriceRange | null }) {
  if (!price) return null;
  const levels = ['€', '€€', '€€€', '€€€€'];
  const activeIndex = levels.indexOf(price);
  
  return (
    <span className="text-sm">
      {levels.map((level, i) => (
        <span key={level} className={i <= activeIndex ? 'price-active' : 'price-inactive'}>
          €
        </span>
      ))}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < fullStars
                ? 'fill-warning text-warning'
                : i === fullStars && hasHalfStar
                ? 'fill-warning/50 text-warning'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function RestaurantCard({ restaurant, className }: RestaurantCardProps) {
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(user?.id, restaurant.id);
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleFavorite.mutate({ userId: user.id, restaurantId: restaurant.id });
    }
  };

  const citySlug = restaurant.city?.slug || 'nederland';
  const imageUrl = restaurant.image_url || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop`;

  return (
    <Link to={`/${citySlug}/${restaurant.slug}`}>
      <Card className={cn('group overflow-hidden card-hover border-0 shadow-md', className)}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Favorite button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-foreground"
              onClick={handleFavoriteClick}
            >
              <Heart
                className={cn(
                  'h-5 w-5 transition-colors',
                  isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
                )}
              />
            </Button>
          )}

          {/* Cuisines */}
          {restaurant.cuisines && restaurant.cuisines.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
              {restaurant.cuisines.slice(0, 2).map((cuisine) => (
                <Badge
                  key={cuisine.id}
                  variant="secondary"
                  className="bg-white/90 text-foreground text-xs"
                >
                  {cuisine.icon} {cuisine.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {restaurant.city?.name || restaurant.address}
                </span>
              </div>
            </div>
            <PriceIndicator price={restaurant.price_range} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <RatingStars rating={Number(restaurant.rating) || 0} />
            <span className="text-sm text-muted-foreground">
              {restaurant.review_count} reviews
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
