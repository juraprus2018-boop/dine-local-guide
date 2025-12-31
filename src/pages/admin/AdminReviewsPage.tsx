import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Star, ArrowLeft, Clock, CheckCircle, Filter } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function useAdminReviews(status: 'pending' | 'approved' | 'all') {
  return useQuery({
    queryKey: ['adminReviews', status],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          restaurant:restaurants(id, name, slug, city:cities(name, slug))
        `)
        .order('created_at', { ascending: false });

      if (status === 'pending') {
        query = query.eq('is_approved', false);
      } else if (status === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating
              ? 'fill-warning text-warning'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const { data: reviews, isLoading } = useAdminReviews(activeTab);

  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      // Get review details first
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          restaurant:restaurants(name, slug, city:cities(slug))
        `)
        .eq('id', reviewId)
        .single();

      if (fetchError) throw fetchError;

      // Update review status
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      // Send approval email
      if (review.guest_email) {
        const restaurantUrl = review.restaurant?.city?.slug && review.restaurant?.slug
          ? `https://happio.nl/${review.restaurant.city.slug}/${review.restaurant.slug}`
          : 'https://happio.nl';

        await supabase.functions.invoke('send-email', {
          body: {
            type: 'review_approved',
            data: {
              email: review.guest_email,
              name: review.guest_name,
              restaurantName: review.restaurant?.name,
              restaurantUrl,
              rating: review.rating,
            },
          },
        });
      }

      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast({ title: 'Review goedgekeurd en email verzonden!' });
    },
    onError: () => {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason?: string }) => {
      // We don't delete, just keep is_approved = false
      // Optionally we could add a rejection_reason column, but for now we just leave it
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast({ title: 'Review afgekeurd' });
    },
    onError: () => {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    },
  });

  if (!isAdmin()) {
    return (
      <Layout title="Geen toegang">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Geen toegang</h1>
          <p className="mt-2 text-muted-foreground">
            Je hebt geen toegang tot deze pagina.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Terug naar home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const pendingCount = reviews?.filter(r => !r.is_approved).length || 0;
  const approvedCount = reviews?.filter(r => r.is_approved).length || 0;

  return (
    <Layout title="Reviews Beheren">
      <div className="container-wide py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar dashboard
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">Reviews Beheren</h1>
          <p className="mt-2 text-muted-foreground">
            Keur reviews goed of af voordat ze op de website verschijnen
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Wachtend
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Goedgekeurd
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              Alle
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="h-24 skeleton rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id} className={cn(
                    !review.is_approved && 'border-warning/50 bg-warning/5'
                  )}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {(review.guest_name || 'G').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {review.guest_name || 'Gast'}
                              </span>
                              <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                                {review.is_approved ? 'Goedgekeurd' : 'Wachtend'}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {review.restaurant && (
                            <Link 
                              to={`/${review.restaurant.city?.slug}/${review.restaurant.slug}`}
                              className="text-sm text-primary hover:underline mt-1 inline-block"
                            >
                              @ {review.restaurant.name}
                            </Link>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <RatingStars rating={review.rating} />
                            <span className="text-sm text-muted-foreground">
                              ({review.rating}/5)
                            </span>
                          </div>

                          {review.title && (
                            <h3 className="mt-2 font-medium">{review.title}</h3>
                          )}
                          {review.content && (
                            <p className="mt-2 text-muted-foreground">{review.content}</p>
                          )}

                          {review.guest_email && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Email: {review.guest_email}
                            </p>
                          )}

                          {/* Actions for pending reviews */}
                          {!review.is_approved && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(review.id)}
                                disabled={approveMutation.isPending}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Goedkeuren
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectMutation.mutate({ reviewId: review.id })}
                                disabled={rejectMutation.isPending}
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                Afkeuren
                              </Button>
                            </div>
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
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium">Geen reviews</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTab === 'pending' 
                      ? 'Er zijn geen reviews die wachten op goedkeuring'
                      : 'Er zijn nog geen reviews'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
