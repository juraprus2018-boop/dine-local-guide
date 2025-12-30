import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { useNearbyRestaurants } from '@/hooks/useRestaurants';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const NearbyPage = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: restaurants, isLoading: isLoadingRestaurants } = useNearbyRestaurants(
    location?.lat ?? null,
    location?.lng ?? null,
    20
  );

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Je browser ondersteunt geen locatiebepaling.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Je hebt geen toestemming gegeven voor locatiebepaling.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Je locatie kon niet worden bepaald.');
            break;
          case error.TIMEOUT:
            setLocationError('Het bepalen van je locatie duurde te lang.');
            break;
          default:
            setLocationError('Er is een fout opgetreden bij het bepalen van je locatie.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  return (
    <Layout>
      <Helmet>
        <title>Restaurants in de Buurt | Happio</title>
        <meta name="description" content="Ontdek restaurants in jouw buurt. Vind de beste eetgelegenheden dichtbij op basis van je huidige locatie." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Navigation className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Restaurants in de Buurt
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ontdek de beste restaurants dichtbij jouw huidige locatie
            </p>
          </div>

          {/* Location Status */}
          {!location && !locationError && (
            <div className="flex flex-col items-center justify-center py-12">
              {isLocating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Je locatie wordt bepaald...</p>
                  <p className="text-muted-foreground">Even geduld alsjeblieft</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Deel je locatie</h2>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Om restaurants in de buurt te tonen, hebben we je locatie nodig.
                  </p>
                  <Button onClick={requestLocation} size="lg">
                    <MapPin className="w-4 h-4 mr-2" />
                    Locatie delen
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Location Error */}
          {locationError && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Locatie niet beschikbaar</h2>
              <p className="text-muted-foreground mb-4 text-center max-w-sm">
                {locationError}
              </p>
              <Button onClick={requestLocation} variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Probeer opnieuw
              </Button>
            </div>
          )}

          {/* Loading Restaurants */}
          {location && isLoadingRestaurants && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Restaurants zoeken...</p>
            </div>
          )}

          {/* Restaurant Results */}
          {location && !isLoadingRestaurants && restaurants && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} gevonden
                </p>
                <Button variant="outline" size="sm" onClick={requestLocation}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Vernieuw locatie
                </Button>
              </div>

              {restaurants.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-medium mb-2">Geen restaurants gevonden</p>
                  <p className="text-muted-foreground">
                    Er zijn nog geen restaurants in jouw omgeving toegevoegd.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {restaurants.map((restaurant: any) => (
                    <div key={restaurant.id} className="relative">
                      <RestaurantCard restaurant={restaurant} />
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" />
                        {formatDistance(restaurant.distance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NearbyPage;
