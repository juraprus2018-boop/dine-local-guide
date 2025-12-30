import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RestaurantMap from '@/components/maps/RestaurantMap';
import { useEffect } from 'react';

export default function AdminImportPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { data: cities } = useCities();
  
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: string[];
    skipped: string[];
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    const city = cities?.find(c => c.id === cityId);
    if (city && city.latitude && city.longitude) {
      setSelectedLocation({ lat: city.latitude, lng: city.longitude });
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleImport = async () => {
    if (!selectedLocation || !selectedCity) {
      toast.error('Selecteer een stad en locatie op de kaart');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('import-google-places', {
        body: {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          radius,
          cityId: selectedCity,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setImportResult(result.details);
      
      toast.success(`${result.imported} restaurants geïmporteerd!`);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Er ging iets mis bij het importeren');
    } finally {
      setIsImporting(false);
    }
  };

  if (authLoading || !user || !isAdmin()) return null;

  const selectedCityData = cities?.find(c => c.id === selectedCity);

  return (
    <Layout title="Restaurants Importeren">
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8">
        <div className="container-wide">
          <Button variant="ghost" onClick={() => navigate('/admin/restaurants')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Restaurants Importeren</h1>
            <p className="text-muted-foreground">
              Importeer restaurants via Google Places API
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Selecteer Locatie
                </CardTitle>
                <CardDescription>
                  Klik op de kaart om een locatie te selecteren. Restaurants binnen de straal worden geïmporteerd.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RestaurantMap
                  center={selectedCityData 
                    ? [selectedCityData.longitude!, selectedCityData.latitude!]
                    : [5.4697, 52.1326]
                  }
                  zoom={selectedCityData ? 13 : 7}
                  interactive
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  className="h-[500px]"
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import Instellingen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stad</label>
                    <Select value={selectedCity} onValueChange={handleCityChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een stad" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Zoekstraal: {(radius / 1000).toFixed(1)} km
                    </label>
                    <Slider
                      value={[radius]}
                      onValueChange={([value]) => setRadius(value)}
                      min={1000}
                      max={10000}
                      step={500}
                    />
                  </div>

                  {selectedLocation && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">Geselecteerde locatie:</p>
                      <p className="text-muted-foreground">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleImport} 
                    disabled={!selectedCity || !selectedLocation || isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importeren...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Importeer Restaurants
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Import Resultaat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {importResult.imported.length > 0 && (
                      <div>
                        <p className="font-medium text-green-600 mb-2">
                          ✓ Geïmporteerd ({importResult.imported.length})
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                          {importResult.imported.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {importResult.skipped.length > 0 && (
                      <div>
                        <p className="font-medium text-amber-600 mb-2">
                          ⊘ Overgeslagen ({importResult.skipped.length})
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                          {importResult.skipped.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {importResult.errors.length > 0 && (
                      <div>
                        <p className="font-medium text-destructive mb-2">
                          ✕ Fouten ({importResult.errors.length})
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                          {importResult.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
