import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Star, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ReCaptcha, { ReCaptchaRef } from '@/components/ReCaptcha';
import { verifyRecaptcha } from '@/hooks/useRecaptcha';

export default function ClaimRestaurantPage() {
  const { citySlug, restaurantSlug } = useParams<{ citySlug?: string; restaurantSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  // Fetch the specific restaurant if we have slug params
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['claim-restaurant', citySlug, restaurantSlug],
    queryFn: async () => {
      if (!citySlug || !restaurantSlug) return null;
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, name, slug, address, rating, review_count, is_claimed, image_url,
          city:cities!inner(name, slug)
        `)
        .eq('slug', restaurantSlug)
        .eq('cities.slug', citySlug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!citySlug && !!restaurantSlug,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Je moet ingelogd zijn om een restaurant te claimen');
      if (!restaurant) throw new Error('Restaurant niet gevonden');
      if (!businessEmail) throw new Error('Zakelijk e-mailadres is verplicht');
      if (!recaptchaToken) throw new Error('Bevestig dat je geen robot bent');

      // Verify reCAPTCHA
      const isValid = await verifyRecaptcha(recaptchaToken);
      if (!isValid) {
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        throw new Error('reCAPTCHA verificatie mislukt. Probeer opnieuw.');
      }

      const { error } = await supabase
        .from('restaurant_claims')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          business_email: businessEmail,
          phone: phone || null,
          message: message || null,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Je hebt dit restaurant al eerder geclaimed');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Claim ingediend! We nemen zo snel mogelijk contact op via e-mail.');
      navigate(`/${citySlug}/${restaurantSlug}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // If no restaurant params, show search page
  if (!citySlug || !restaurantSlug) {
    return <ClaimSearchPage />;
  }

  if (isLoading) {
    return (
      <Layout title="Restaurant claimen">
        <div className="container-wide py-12">
          <div className="max-w-xl mx-auto">
            <div className="h-8 w-64 skeleton rounded mb-4" />
            <div className="h-48 skeleton rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout title="Restaurant niet gevonden">
        <div className="container-wide py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant niet gevonden</h1>
          <Button asChild>
            <Link to="/claimen">Zoek een restaurant</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (restaurant.is_claimed) {
    return (
      <Layout title="Restaurant al geclaimed">
        <div className="container-wide py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Dit restaurant is al geclaimed</h1>
          <p className="text-muted-foreground mb-4">
            {restaurant.name} heeft al een eigenaar op Mijn Restaurant.
          </p>
          <Button asChild>
            <Link to={`/${citySlug}/${restaurantSlug}`}>Terug naar restaurant</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${restaurant.name} claimen`}>
      <div className="container-wide py-12">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/${citySlug}/${restaurantSlug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar {restaurant.name}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Claim {restaurant.name}</CardTitle>
              <CardDescription>
                Vul onderstaande gegevens in om dit restaurant te claimen. Na verificatie krijg je toegang tot het eigenaar dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Restaurant info */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg mb-6">
                {restaurant.image_url && (
                  <img 
                    src={restaurant.image_url} 
                    alt={restaurant.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                  {restaurant.rating && restaurant.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span>{Number(restaurant.rating).toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({restaurant.review_count} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Je moet ingelogd zijn om een restaurant te claimen.
                  </p>
                  <Button asChild>
                    <Link to={`/auth?redirect=/claimen/${citySlug}/${restaurantSlug}`}>
                      Inloggen of registreren
                    </Link>
                  </Button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    claimMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Zakelijk e-mailadres *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="info@uwrestaurant.nl"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Bij voorkeur het e-mailadres van het restaurant
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+31 6 12345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Aanvullende informatie</Label>
                    <Textarea
                      id="message"
                      placeholder="Optionele toelichting, bijvoorbeeld uw functie binnen het restaurant..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <ReCaptcha
                    ref={recaptchaRef}
                    onChange={setRecaptchaToken}
                    className="flex justify-center"
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!businessEmail || !recaptchaToken || claimMutation.isPending}
                  >
                    {claimMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verzenden...
                      </>
                    ) : (
                      'Claim indienen'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Search page component for when no restaurant is specified
function ClaimSearchPage() {
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
      description="Claim je restaurant op Mijn Restaurant en beheer je vermelding, foto's en reageer op reviews."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold">Restaurant claimen</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Is je restaurant al op Mijn Restaurant? Zoek het hieronder en claim het.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <Input
            placeholder="Zoek je restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 text-lg"
          />
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
                      <Link to={`/claimen/${restaurant.city?.slug}/${restaurant.slug}`}>
                        Claim
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
