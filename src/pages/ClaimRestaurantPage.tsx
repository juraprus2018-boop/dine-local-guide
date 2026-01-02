import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ClaimRestaurantPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['claimable-restaurants', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, name, slug, address, rating, review_count, is_claimed,
          city:cities(name, slug)
        `)
        .ilike('name', `%${searchQuery}%`)
        .eq('is_claimed', false)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  return (
    <Layout
      title="Restaurant claimen"
      description="Claim je restaurant op Happio en beheer je vermelding, foto's en reageer op reviews."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold">Restaurant claimen</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Is je restaurant al op Happio? Claim het en krijg toegang tot je eigenaar dashboard.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Zoek je restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Typ minimaal 2 karakters om te zoeken
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 skeleton rounded-lg" />
            ))}
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {restaurants.map((restaurant: any) => (
              <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {restaurant.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span>{Number(restaurant.rating).toFixed(1)}</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {restaurant.city?.name}
                        </span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={`/${restaurant.city?.slug}/${restaurant.slug}`}>
                        Bekijk & Claim
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Geen ongeclaimde restaurants gevonden met "{searchQuery}"
            </p>
            <Button asChild variant="outline">
              <Link to="/aanmelden">Restaurant aanmelden</Link>
            </Button>
          </div>
        ) : null}

        {/* Benefits */}
        <div className="mt-16 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Beheer je info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Werk je openingstijden, menu en contactgegevens bij wanneer je wilt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Upload foto's
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voeg professionele foto's toe en laat je restaurant op z'n best zien.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Reageer op reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reageer op reviews en bouw een band op met je klanten.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
