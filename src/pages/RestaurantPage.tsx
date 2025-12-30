import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  MapPin, Phone, Globe, Clock, Star, Heart, Share2, 
  ChevronLeft, ChevronRight, ExternalLink, Check, X
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant, useReviews, useAddReview, useToggleFavorite, useIsFavorite } from '@/hooks/useRestaurants';
import { cn } from '@/lib/utils';
import { PhotoUpload } from '@/components/restaurants/PhotoUpload';
import { ClaimButton } from '@/components/restaurants/ClaimButton';
import type { OpeningHours, DayHours } from '@/types/database';

const dayNames: Record<string, string> = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag',
};

function formatHours(hours: DayHours | undefined): string {
  if (!hours || hours.closed) return 'Gesloten';
  return `${hours.open} - ${hours.close}`;
}

function isOpenNow(openingHours: OpeningHours | null): boolean {
  if (!openingHours) return false;
  const now = new Date();
  const dayIndex = now.getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[dayIndex] as keyof OpeningHours;
  const todayHours = openingHours[today];
  
  if (!todayHours || todayHours.closed) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
}

function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= rating
              ? 'fill-warning text-warning'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

export default function RestaurantPage() {
  const { citySlug, restaurantSlug } = useParams<{ citySlug: string; restaurantSlug: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: restaurant, isLoading } = useRestaurant(citySlug || '', restaurantSlug || '');
  const { data: reviews } = useReviews(restaurant?.id || '');
  const { data: isFavorite } = useIsFavorite(user?.id, restaurant?.id || '');
  const toggleFavorite = useToggleFavorite();
  const addReview = useAddReview();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  if (isLoading) {
    return (
      <Layout>
        <div className="container-wide py-8">
          <div className="h-64 skeleton rounded-lg mb-6" />
          <div className="h-8 w-64 skeleton rounded mb-4" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout title="Restaurant niet gevonden">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Restaurant niet gevonden</h1>
          <p className="mt-2 text-muted-foreground">
            We konden dit restaurant niet vinden.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Terug naar home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const photos = restaurant.photos?.length 
    ? restaurant.photos 
    : [{ id: '1', url: restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop', caption: null }];

  const handleFavoriteClick = () => {
    if (!user) {
      toast({ title: 'Log in om favorieten op te slaan', variant: 'destructive' });
      return;
    }
    toggleFavorite.mutate({ userId: user.id, restaurantId: restaurant.id });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: restaurant.name,
        text: `Bekijk ${restaurant.name} op Happio`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link gekopieerd!' });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addReview.mutateAsync({
        restaurant_id: restaurant.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        content: reviewContent || undefined,
        user_id: user?.id,
        guest_name: !user ? guestName : undefined,
        guest_email: !user ? guestEmail : undefined,
      });
      
      toast({ title: 'Review geplaatst!' });
      setReviewRating(5);
      setReviewTitle('');
      setReviewContent('');
      setGuestName('');
      setGuestEmail('');
    } catch (error) {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    }
  };

  const isOpen = isOpenNow(restaurant.opening_hours);

  return (
    <Layout
      title={restaurant.name}
      description={restaurant.meta_description || `${restaurant.name} in ${restaurant.city?.name}. Bekijk reviews, foto's en openingstijden.`}
    >
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to={`/${citySlug}`} className="hover:text-foreground">{restaurant.city?.name}</Link>
            <span>/</span>
            <span className="text-foreground truncate">{restaurant.name}</span>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <section className="relative bg-muted">
        <div className="relative aspect-[21/9] max-h-[400px] overflow-hidden">
          <img
            src={photos[currentPhotoIndex]?.url}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={() => setCurrentPhotoIndex(i => i === 0 ? photos.length - 1 : i - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={() => setCurrentPhotoIndex(i => i === photos.length - 1 ? 0 : i + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    )}
                    onClick={() => setCurrentPhotoIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {restaurant.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" /> Geverifieerd
                        </Badge>
                      )}
                      <Badge variant={isOpen ? 'default' : 'secondary'} className={isOpen ? 'bg-success' : ''}>
                        {isOpen ? 'Nu geopend' : 'Gesloten'}
                      </Badge>
                    </div>
                    <h1 className="font-display text-3xl font-bold md:text-4xl">
                      {restaurant.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <RatingStars rating={Number(restaurant.rating)} size="lg" />
                        <span className="font-semibold">{Number(restaurant.rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">({restaurant.review_count} reviews)</span>
                      </div>
                      {restaurant.price_range && (
                        <span className="font-medium">{restaurant.price_range}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleFavoriteClick}>
                      <Heart className={cn('h-5 w-5', isFavorite && 'fill-primary text-primary')} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Cuisines */}
                {restaurant.cuisines && restaurant.cuisines.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {restaurant.cuisines.map((cuisine) => (
                      <Badge key={cuisine.id} variant="secondary">
                        {cuisine.icon} {cuisine.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                {restaurant.description && (
                  <p className="mt-4 text-muted-foreground">
                    {restaurant.description}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <PhotoUpload restaurantId={restaurant.id} />
                  <ClaimButton 
                    restaurantId={restaurant.id} 
                    restaurantName={restaurant.name}
                    isClaimed={restaurant.is_claimed || false}
                  />
                </div>
              </div>

              <Separator />

              {/* Tabs */}
              <Tabs defaultValue="reviews">
                <TabsList>
                  <TabsTrigger value="reviews">Reviews ({restaurant.review_count})</TabsTrigger>
                  <TabsTrigger value="photos">Foto's ({photos.length})</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="mt-6 space-y-6">
                  {/* Write Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Schrijf een review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <Label>Beoordeling</Label>
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={cn(
                                    'h-8 w-8 transition-colors',
                                    star <= reviewRating
                                      ? 'fill-warning text-warning'
                                      : 'text-muted-foreground/30 hover:text-warning/50'
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {!user && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="guestName">Je naam</Label>
                              <Input
                                id="guestName"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                required={!user}
                              />
                            </div>
                            <div>
                              <Label htmlFor="guestEmail">Je email</Label>
                              <Input
                                id="guestEmail"
                                type="email"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                required={!user}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="reviewTitle">Titel (optioneel)</Label>
                          <Input
                            id="reviewTitle"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="Samenvattend kopje"
                          />
                        </div>

                        <div>
                          <Label htmlFor="reviewContent">Je ervaring</Label>
                          <Textarea
                            id="reviewContent"
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="Vertel over je bezoek..."
                            rows={4}
                          />
                        </div>

                        <Button type="submit" disabled={addReview.isPending}>
                          {addReview.isPending ? 'Bezig...' : 'Review plaatsen'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Reviews List */}
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <Card key={review.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={review.profile?.avatar_url} />
                                <AvatarFallback>
                                  {(review.profile?.display_name || review.guest_name || 'G').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium">
                                    {review.profile?.display_name || review.guest_name || 'Gast'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString('nl-NL')}
                                  </span>
                                </div>
                                <RatingStars rating={review.rating} size="sm" />
                                {review.title && (
                                  <h4 className="mt-2 font-medium">{review.title}</h4>
                                )}
                                {review.content && (
                                  <p className="mt-1 text-muted-foreground">{review.content}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen reviews. Wees de eerste!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="photos" className="mt-6">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {photos.map((photo: any, i: number) => (
                      <div key={photo.id || i} className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={photo.url}
                          alt={photo.caption || restaurant.name}
                          className="h-full w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setCurrentPhotoIndex(i)}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="info" className="mt-6 space-y-6">
                  {restaurant.specialties && restaurant.specialties.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Specialiteiten</h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.specialties.map((specialty, i) => (
                          <Badge key={i} variant="outline">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {restaurant.features && (restaurant.features as string[]).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Voorzieningen</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(restaurant.features as string[]).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-success" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Adres</p>
                      <p className="text-sm text-muted-foreground">
                        {restaurant.address}
                        {restaurant.postal_code && `, ${restaurant.postal_code}`}
                        {restaurant.city && ` ${restaurant.city.name}`}
                      </p>
                    </div>
                  </div>

                  {restaurant.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Telefoon</p>
                        <a href={`tel:${restaurant.phone}`} className="text-sm text-primary hover:underline">
                          {restaurant.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {restaurant.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Bezoek website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Opening Hours */}
              {restaurant.opening_hours && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Openingstijden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(dayNames).map(([key, name]) => {
                        const hours = (restaurant.opening_hours as OpeningHours)?.[key as keyof OpeningHours];
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                        const isToday = key === today;
                        
                        return (
                          <div
                            key={key}
                            className={cn(
                              'flex justify-between text-sm',
                              isToday && 'font-medium'
                            )}
                          >
                            <span>{name}</span>
                            <span className={hours?.closed ? 'text-muted-foreground' : ''}>
                              {formatHours(hours)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claim CTA */}
              {!restaurant.is_claimed && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 text-center">
                    <p className="font-medium">Is dit jouw restaurant?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Claim dit restaurant om je gegevens te beheren.
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <Link to={`/claimen?restaurant=${restaurant.id}`}>
                        Restaurant claimen
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
