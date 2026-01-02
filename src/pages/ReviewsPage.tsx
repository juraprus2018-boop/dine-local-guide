import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Search, Camera, X } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurants, useAddReview } from '@/hooks/useRestaurants';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { toast as sonnerToast } from 'sonner';

function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4' };
  
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

function useRecentReviews() {
  return useQuery({
    queryKey: ['recentReviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          restaurant:restaurants(id, name, slug, city:cities(name, slug))
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews, isLoading } = useRecentReviews();
  const { data: restaurantsData } = useRestaurants({ limit: 100 });
  const addReview = useAddReview();

  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        sonnerToast.error(`${file.name} is te groot (max 10MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        sonnerToast.error(`${file.name} is geen afbeelding`);
        return false;
      }
      return true;
    });

    if (reviewPhotos.length + validFiles.length > 5) {
      sonnerToast.error('Maximaal 5 foto\'s toegestaan');
      return;
    }

    setReviewPhotos(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const restaurants = restaurantsData?.restaurants || [];
  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      toast({ title: 'Selecteer een restaurant', variant: 'destructive' });
      return;
    }

    const restaurant = restaurants.find(r => r.id === selectedRestaurant);
    
    try {
      const result = await addReview.mutateAsync({
        restaurant_id: selectedRestaurant,
        rating: reviewRating,
        title: reviewTitle || undefined,
        content: reviewContent || undefined,
        user_id: user?.id,
        guest_name: !user ? guestName : undefined,
        guest_email: !user ? guestEmail : undefined,
        restaurant_name: restaurant?.name,
        city_name: restaurant?.city?.name,
      });

      // Upload photos if any
      if (reviewPhotos.length > 0 && result?.id) {
        for (const photo of reviewPhotos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `reviews/${result.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('restaurant-photos')
            .upload(fileName, photo, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('restaurant-photos')
              .getPublicUrl(fileName);

            await supabase.from('review_photos').insert({
              review_id: result.id,
              user_id: user?.id || null,
              guest_email: user ? null : guestEmail,
              url: publicUrl,
            });
          }
        }
      }
      
      toast({ 
        title: 'Review ontvangen! 📝',
        description: 'Je review wordt eerst nagekeken door onze beheerders. Je ontvangt een email zodra deze online staat.',
      });
      setSelectedRestaurant('');
      setReviewRating(5);
      setReviewTitle('');
      setReviewContent('');
      setGuestName('');
      setGuestEmail('');
      setReviewPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    }
  };

  return (
    <Layout
      title="Reviews"
      description="Lees recente reviews van restaurants en deel je eigen ervaring."
    >
      <div className="container-wide py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Reviews</h1>
          <p className="mt-2 text-muted-foreground">
            Lees ervaringen van anderen en deel je eigen review
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Write Review Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Schrijf een review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Restaurant Selection */}
                  <div>
                    <Label>Restaurant</Label>
                    <div className="relative mt-1.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Zoek restaurant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecteer restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRestaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name} - {restaurant.city?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating */}
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
                              'h-7 w-7 transition-colors',
                              star <= reviewRating
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground/30 hover:text-warning/50'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guest Fields */}
                  {!user && (
                    <div className="space-y-3">
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

                  {/* Title */}
                  <div>
                    <Label htmlFor="reviewTitle">Titel (optioneel)</Label>
                    <Input
                      id="reviewTitle"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Kort en krachtig"
                    />
                  </div>

                  {/* Content */}
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

                  {/* Photo Upload */}
                  <div>
                    <Label>Foto's toevoegen (optioneel)</Label>
                    <div className="mt-2">
                      {photoPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="h-16 w-16 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={reviewPhotos.length >= 5}
                        className="gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Foto's toevoegen
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 5 foto's, 10MB per foto
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={addReview.isPending}>
                    {addReview.isPending ? 'Bezig...' : 'Review plaatsen'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Recente reviews</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 skeleton rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 skeleton rounded" />
                          <div className="h-3 w-48 skeleton rounded" />
                          <div className="h-16 skeleton rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {(review.guest_name || 'G').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="font-medium">
                                {review.guest_name || 'Gast'}
                              </span>
                              {review.restaurant && (
                                <Link 
                                  to={`/${review.restaurant.city?.slug}/${review.restaurant.slug}`}
                                  className="ml-2 text-sm text-primary hover:underline"
                                >
                                  @ {review.restaurant.name}
                                </Link>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="mt-1">
                            <RatingStars rating={review.rating} />
                          </div>
                          {review.title && (
                            <h3 className="mt-2 font-medium">{review.title}</h3>
                          )}
                          {review.content && (
                            <p className="mt-2 text-muted-foreground">{review.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium">Nog geen reviews</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Wees de eerste die een review plaatst!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
