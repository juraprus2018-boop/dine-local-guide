import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, Loader2, Building2, Utensils, Globe, Play, Pause } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RestaurantMap from '@/components/maps/RestaurantMap';
import { useEffect } from 'react';

export default function AdminImportPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [isImporting, setIsImporting] = useState(false);
  const [isLinkingCuisines, setIsLinkingCuisines] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    processed: number;
    total: number;
    currentBatch: any[];
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: string[];
    skipped: string[];
    errors: string[];
    citiesCreated: string[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedLocation) {
      toast.error('Klik op de kaart om een locatie te selecteren');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await supabase.functions.invoke('import-google-places', {
        body: {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          radius,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setImportResult(result.details);
      
      if (result.citiesCreated > 0) {
        toast.success(`${result.imported} restaurants geïmporteerd in ${result.citiesCreated} nieuwe steden!`);
      } else {
        toast.success(`${result.imported} restaurants geïmporteerd!`);
      }
      
    } catch (error: unknown) {
      console.error('Import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Er ging iets mis bij het importeren';
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleLinkCuisines = async () => {
    setIsLinkingCuisines(true);
    
    try {
      const response = await supabase.functions.invoke('link-cuisines');

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(`${result.cuisinesLinked} keuken-koppelingen gemaakt voor ${result.processed} restaurants!`);
      
    } catch (error: unknown) {
      console.error('Link cuisines error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Er ging iets mis bij het koppelen van keukens';
      toast.error(errorMsg);
    } finally {
      setIsLinkingCuisines(false);
    }
  };

  const handleBulkImport = async () => {
    setIsBulkImporting(true);
    setBulkProgress({ processed: 0, total: 50, currentBatch: [] });

    let nextIndex: number | null = 0;
    
    while (nextIndex !== null && isBulkImporting) {
      try {
        const response = await supabase.functions.invoke('bulk-import-restaurants', {
          body: {
            startIndex: nextIndex,
            batchSize: 3, // Process 3 cities at a time
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const result = response.data;
        
        setBulkProgress({
          processed: result.processed,
          total: result.totalCities,
          currentBatch: result.results,
        });

        if (result.completed) {
          toast.success('Alle steden zijn verwerkt!');
          break;
        }

        nextIndex = result.nextIndex;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: unknown) {
        console.error('Bulk import error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Er ging iets mis';
        toast.error(errorMsg);
        break;
      }
    }

    setIsBulkImporting(false);
  };

  const handleStopBulkImport = () => {
    setIsBulkImporting(false);
    toast.info('Import wordt gestopt na huidige batch...');
  };

  if (authLoading || !user || !isAdmin()) return null;

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
              Klik op de kaart om restaurants te importeren. Steden worden automatisch aangemaakt.
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
                  Klik ergens op de kaart. Restaurants in de omgeving worden geïmporteerd, 
                  en de bijbehorende stad/gemeente wordt automatisch aangemaakt als deze nog niet bestaat.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RestaurantMap
                  zoom={8}
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
                  <CardDescription>
                    De stad en provincie worden automatisch bepaald op basis van de Google Places data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">
                      Alle restaurants binnen deze straal worden geïmporteerd
                    </p>
                  </div>

                  {selectedLocation && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        Geselecteerde locatie
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleImport} 
                    disabled={!selectedLocation || isImporting}
                    className="w-full"
                    size="lg"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Importeren...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Importeer Restaurants
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Keukens Koppelen
                  </CardTitle>
                  <CardDescription>
                    Koppel bestaande restaurants aan keuken types op basis van Google Places data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleLinkCuisines} 
                    disabled={isLinkingCuisines}
                    className="w-full"
                    variant="outline"
                  >
                    {isLinkingCuisines ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Keukens koppelen...
                      </>
                    ) : (
                      <>
                        <Utensils className="mr-2 h-5 w-5" />
                        Koppel Keukens aan Restaurants
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Bulk Import Nederland
                  </CardTitle>
                  <CardDescription>
                    Importeer automatisch 5 restaurants per stad voor de 50 grootste steden van Nederland.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bulkProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Voortgang</span>
                        <span>{bulkProgress.processed} / {bulkProgress.total} steden</span>
                      </div>
                      <Progress value={(bulkProgress.processed / bulkProgress.total) * 100} />
                      
                      {bulkProgress.currentBatch.length > 0 && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Laatste batch:</p>
                          {bulkProgress.currentBatch.map((item: any, i: number) => (
                            <p key={i}>
                              {item.city}: {item.imported} restaurants 
                              {item.error && <span className="text-destructive"> ({item.error})</span>}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isBulkImporting ? (
                    <Button 
                      onClick={handleStopBulkImport}
                      className="w-full"
                      variant="destructive"
                    >
                      <Pause className="mr-2 h-5 w-5" />
                      Stop Import
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleBulkImport}
                      className="w-full"
                      variant="default"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Start Bulk Import (50 steden)
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Dit gebruikt veel Google API credits. Zorg dat je voldoende budget hebt.
                  </p>
                </CardContent>
              </Card>

              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Import Resultaat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {importResult.citiesCreated.length > 0 && (
                      <div>
                        <p className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Nieuwe steden ({importResult.citiesCreated.length})
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                          {importResult.citiesCreated.map((name, i) => (
                            <li key={i}>+ {name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
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
                        <ul className="text-sm text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
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
