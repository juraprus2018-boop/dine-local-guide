import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Store, Star, MessageSquare, Camera, Settings } from 'lucide-react';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { AdManagementCard } from '@/components/dashboard/AdManagementCard';

export default function OwnerDashboardPage() {
  const { user } = useAuth();

  const { data: ownedRestaurants, isLoading } = useQuery({
    queryKey: ['owned-restaurants', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(name, slug)
        `)
        .eq('owner_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout title="Eigenaar Dashboard" description="Beheer je restaurant op Happio.">
        <div className="container-wide py-12">
          <div className="text-center py-16">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Log in om verder te gaan</h1>
            <p className="text-muted-foreground mb-6">
              Je moet ingelogd zijn om je restaurant(s) te beheren.
            </p>
            <Button asChild>
              <Link to="/auth">Inloggen</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Eigenaar Dashboard" description="Beheer je restaurant op Happio.">
      <div className="container-wide py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Eigenaar Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Beheer je restaurant(s) en bekijk statistieken
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 skeleton rounded-lg" />
            ))}
          </div>
        ) : ownedRestaurants && ownedRestaurants.length > 0 ? (
          <div className="space-y-8">
            {ownedRestaurants.map((restaurant: any) => (
              <div key={restaurant.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {restaurant.address}, {restaurant.city?.name}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/${restaurant.city?.slug}/${restaurant.slug}`}>
                          Bekijk pagina
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-3 mb-6">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Star className="h-6 w-6 mx-auto text-warning mb-2" />
                        <p className="text-2xl font-bold">{Number(restaurant.rating).toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Beoordeling</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <MessageSquare className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold">{restaurant.review_count}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Camera className="h-6 w-6 mx-auto text-accent mb-2" />
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-xs text-muted-foreground">Foto's</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Bewerk informatie
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Camera className="h-4 w-4" />
                        Foto's beheren
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Bekijk reviews
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics */}
                <AnalyticsCard restaurantId={restaurant.id} restaurantName={restaurant.name} />

                {/* Ad Management */}
                <AdManagementCard restaurantId={restaurant.id} restaurantName={restaurant.name} />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Geen restaurants gevonden</h2>
              <p className="text-muted-foreground mb-6">
                Je hebt nog geen restaurants geclaimd of aangemeld.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/claimen">Restaurant claimen</Link>
                </Button>
                <Button asChild>
                  <Link to="/aanmelden">Restaurant aanmelden</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
