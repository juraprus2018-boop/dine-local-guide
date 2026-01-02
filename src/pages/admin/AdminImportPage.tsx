import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MapPin, Loader2, Building2, Utensils, Globe, Play, RefreshCw, CheckCircle, XCircle, Clock, Activity, Zap, Camera } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RestaurantMap from '@/components/maps/RestaurantMap';
import { useRestaurantLocations } from '@/hooks/useRestaurants';

interface ImportJob {
  id: string;
  status: string;
  total_cities: number;
  processed_cities: number;
  imported_restaurants: number;
  imported_reviews: number;
  skipped_restaurants: number;
  errors: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  last_city: string | null;
}

interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'city' | 'restaurant' | 'skip' | 'error' | 'info';
  message: string;
}

export default function AdminImportPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  
  // Fetch all existing restaurant locations for map (lightweight query)
  const { data: restaurantLocations, isLoading: locationsLoading } = useRestaurantLocations();
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [isImporting, setIsImporting] = useState(false);
  const [isLinkingCuisines, setIsLinkingCuisines] = useState(false);
  const [isRefreshingPhotos, setIsRefreshingPhotos] = useState(false);
  const [photoRefreshProgress, setPhotoRefreshProgress] = useState<{
    processed: number;
    total: number;
    photosDownloaded: number;
    errors: string[];
  } | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: string[];
    skipped: string[];
    errors: string[];
    citiesCreated: string[];
  } | null>(null);

  const prevJobRef = useRef<ImportJob | null>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Add to activity log
  const addLogEntry = useCallback((type: ActivityLogEntry['type'], message: string) => {
    setActivityLog(prev => {
      const newEntry: ActivityLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type,
        message,
      };
      // Keep last 100 entries
      return [...prev, newEntry].slice(-100);
    });
  }, []);

  // Fetch job status
  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke('bulk-import-restaurants', {
        body: { action: 'status' },
      });

      if (response.error) {
        console.error('Status fetch error:', response.error);
        return;
      }

      if (response.data?.job) {
        const newJob = response.data.job as ImportJob;
        const prevJob = prevJobRef.current;

        // Detect changes and log them
        if (prevJob && newJob.id === prevJob.id) {
          // New city processed
          if (newJob.last_city && newJob.last_city !== prevJob.last_city) {
            if (newJob.last_city.includes('overgeslagen')) {
              addLogEntry('skip', `⏭️ ${newJob.last_city}`);
            } else {
              addLogEntry('city', `📍 Stad verwerkt: ${newJob.last_city}`);
            }
          }

          // New restaurants imported
          const newRestaurants = newJob.imported_restaurants - (prevJob.imported_restaurants || 0);
          if (newRestaurants > 0) {
            addLogEntry('restaurant', `🍽️ +${newRestaurants} restaurants geïmporteerd`);
          }

          // New reviews
          const newReviews = newJob.imported_reviews - (prevJob.imported_reviews || 0);
          if (newReviews > 0) {
            addLogEntry('info', `⭐ +${newReviews} reviews toegevoegd`);
          }

          // New skips
          const newSkips = newJob.skipped_restaurants - (prevJob.skipped_restaurants || 0);
          if (newSkips > 0) {
            addLogEntry('skip', `⊘ ${newSkips} restaurants overgeslagen (duplicaten)`);
          }

          // New errors
          if (newJob.errors && prevJob.errors) {
            const newErrors = newJob.errors.slice(prevJob.errors.length);
            newErrors.forEach(err => {
              addLogEntry('error', `❌ ${err}`);
            });
          }

          // Status change
          if (newJob.status !== prevJob.status) {
            if (newJob.status === 'completed') {
              addLogEntry('info', `✅ Import voltooid! ${newJob.imported_restaurants} restaurants, ${newJob.imported_reviews} reviews`);
            } else if (newJob.status === 'failed') {
              addLogEntry('error', '❌ Import mislukt');
            }
          }
        } else if (!prevJob && newJob.status === 'running') {
          addLogEntry('info', '🚀 Import gestart...');
        }

        prevJobRef.current = newJob;
        setCurrentJob(newJob);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }, [addLogEntry]);

  // Realtime subscription for import_jobs table
  useEffect(() => {
    const channel = supabase
      .channel('import-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
        },
        (payload) => {
          const newJob = payload.new as ImportJob;
          const prevJob = prevJobRef.current;

          // Detect changes and log them
          if (prevJob && newJob.id === prevJob.id) {
            if (newJob.last_city && newJob.last_city !== prevJob.last_city) {
              if (newJob.last_city.includes('overgeslagen')) {
                addLogEntry('skip', `⏭️ ${newJob.last_city}`);
              } else {
                addLogEntry('city', `📍 Stad: ${newJob.last_city}`);
              }
            }

            const newRestaurants = newJob.imported_restaurants - (prevJob.imported_restaurants || 0);
            if (newRestaurants > 0) {
              addLogEntry('restaurant', `🍽️ +${newRestaurants} restaurants`);
            }

            const newReviews = newJob.imported_reviews - (prevJob.imported_reviews || 0);
            if (newReviews > 0) {
              addLogEntry('info', `⭐ +${newReviews} reviews`);
            }

            const newSkips = newJob.skipped_restaurants - (prevJob.skipped_restaurants || 0);
            if (newSkips > 0) {
              addLogEntry('skip', `⊘ ${newSkips} duplicaten geskipt`);
            }

            if (newJob.errors && prevJob.errors && newJob.errors.length > prevJob.errors.length) {
              const newErrors = newJob.errors.slice(prevJob.errors.length);
              newErrors.forEach(err => addLogEntry('error', `❌ ${err}`));
            }

            if (newJob.status !== prevJob.status) {
              if (newJob.status === 'completed') {
                addLogEntry('info', `✅ VOLTOOID! ${newJob.imported_restaurants} restaurants`);
              } else if (newJob.status === 'failed') {
                addLogEntry('error', '❌ Import mislukt!');
              }
            }
          }

          prevJobRef.current = newJob;
          setCurrentJob(newJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addLogEntry]);

  // Initial fetch and polling fallback
  useEffect(() => {
    fetchJobStatus();

    // Poll every 3 seconds as fallback (realtime is primary)
    const interval = setInterval(() => {
      if (currentJob?.status === 'running' || currentJob?.status === 'pending') {
        fetchJobStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchJobStatus, currentJob?.status]);

  useEffect(() => {
    // Wait for auth to fully load before checking admin status
    if (authLoading) return;
    
    // Only redirect if we're certain the user is not an admin
    if (!user || !isAdmin()) {
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

  const handleRefreshPhotos = async () => {
    setIsRefreshingPhotos(true);
    setPhotoRefreshProgress({ processed: 0, total: 0, photosDownloaded: 0, errors: [] });
    
    let offset = 0;
    const batchSize = 10;
    let hasMore = true;
    let totalProcessed = 0;
    let totalPhotos = 0;
    const allErrors: string[] = [];
    let totalRestaurants = 0;

    try {
      while (hasMore) {
        addLogEntry('info', `📸 Verwerken batch ${Math.floor(offset / batchSize) + 1}...`);
        
        const response = await supabase.functions.invoke('refresh-restaurant-photos', {
          body: { batchSize, offset },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const result = response.data;
        totalProcessed += result.processed || 0;
        totalPhotos += result.photosDownloaded || 0;
        totalRestaurants = result.totalRestaurants || totalRestaurants;
        
        if (result.errors?.length > 0) {
          allErrors.push(...result.errors);
        }

        setPhotoRefreshProgress({
          processed: totalProcessed,
          total: totalRestaurants,
          photosDownloaded: totalPhotos,
          errors: allErrors,
        });

        addLogEntry('restaurant', `📷 ${result.processed} restaurants, ${result.photosDownloaded} foto's`);

        hasMore = result.hasMore || false;
        offset = result.nextOffset || offset + batchSize;

        // Small delay to prevent rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      addLogEntry('info', `✅ Klaar! ${totalProcessed} restaurants, ${totalPhotos} foto's`);
      toast.success(`Foto's vernieuwd: ${totalPhotos} foto's voor ${totalProcessed} restaurants`);
      
    } catch (error: unknown) {
      console.error('Refresh photos error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Er ging iets mis';
      addLogEntry('error', `❌ Foto refresh mislukt: ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setIsRefreshingPhotos(false);
    }
  };

  const handleStartBulkImport = async () => {
    setIsLoadingStatus(true);
    setActivityLog([]); // Clear previous logs

    try {
      const response = await supabase.functions.invoke('bulk-import-restaurants', {
        body: { action: 'start' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        toast.error(response.data.error || 'Kon import niet starten');
        return;
      }

      addLogEntry('info', '🚀 Bulk import gestart!');
      toast.success('Import gestart! Dit draait op de achtergrond.');
      
      // Refresh status
      await fetchJobStatus();
      
    } catch (error: unknown) {
      console.error('Start import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Er ging iets mis';
      addLogEntry('error', `❌ Start mislukt: ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoadingStatus(true);
    await fetchJobStatus();
    setIsLoadingStatus(false);
    toast.success('Status vernieuwd');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Bezig</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Voltooid</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Mislukt</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Wachtend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt) return '-';
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
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
                {locationsLoading ? (
                <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Restaurants laden...</p>
                    </div>
                  </div>
                ) : (
                  <RestaurantMap
                    restaurantLocations={restaurantLocations || []}
                    zoom={8}
                    interactive
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    className="h-[500px]"
                  />
                )}
                {restaurantLocations && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {restaurantLocations.length.toLocaleString()} restaurants op de kaart
                  </p>
                )}
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
                    <Camera className="h-5 w-5" />
                    Foto's Vernieuwen
                  </CardTitle>
                  <CardDescription>
                    Download alle foto's opnieuw via Google Places API voor alle restaurants.
                    <strong className="block mt-1 text-amber-600">⚠️ Let op: dit kan lang duren en kost API credits!</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photoRefreshProgress && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Voortgang</span>
                          <span>{photoRefreshProgress.processed} / {photoRefreshProgress.total} restaurants</span>
                        </div>
                        <Progress 
                          value={photoRefreshProgress.total > 0 
                            ? (photoRefreshProgress.processed / photoRefreshProgress.total) * 100 
                            : 0
                          } 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-green-500/10 text-green-700">
                          <div className="font-medium">{photoRefreshProgress.photosDownloaded}</div>
                          <div className="text-xs">Foto's gedownload</div>
                        </div>
                        <div className="p-2 rounded bg-red-500/10 text-red-700">
                          <div className="font-medium">{photoRefreshProgress.errors.length}</div>
                          <div className="text-xs">Fouten</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleRefreshPhotos} 
                    disabled={isRefreshingPhotos}
                    className="w-full"
                    variant="outline"
                  >
                    {isRefreshingPhotos ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Foto's downloaden...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        Vernieuw Alle Foto's
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
                    Importeer automatisch 5 restaurants per stad voor alle ~350 steden van Nederland.
                    <strong className="block mt-1 text-primary">✓ Draait op de achtergrond - je kunt de pagina verlaten!</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentJob && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Import Status</span>
                        {getStatusBadge(currentJob.status)}
                      </div>
                      
                      {(currentJob.status === 'running' || currentJob.status === 'completed') && (
                        <>
                          {/* Laatste stad indicator */}
                          {currentJob.last_city && (
                            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 text-primary">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {currentJob.status === 'running' ? 'Bezig met:' : 'Laatste stad:'} {currentJob.last_city}
                              </span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Voortgang</span>
                              <span>{currentJob.processed_cities} / {currentJob.total_cities} steden</span>
                            </div>
                            <Progress 
                              value={currentJob.total_cities > 0 
                                ? (currentJob.processed_cities / currentJob.total_cities) * 100 
                                : 0
                              } 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 rounded bg-green-500/10 text-green-700">
                              <div className="font-medium">{currentJob.imported_restaurants}</div>
                              <div className="text-xs">Restaurants</div>
                            </div>
                            <div className="p-2 rounded bg-blue-500/10 text-blue-700">
                              <div className="font-medium">{currentJob.imported_reviews}</div>
                              <div className="text-xs">Reviews</div>
                            </div>
                            <div className="p-2 rounded bg-amber-500/10 text-amber-700">
                              <div className="font-medium">{currentJob.skipped_restaurants}</div>
                              <div className="text-xs">Overgeslagen</div>
                            </div>
                            <div className="p-2 rounded bg-muted-foreground/10">
                              <div className="font-medium">{formatDuration(currentJob.started_at, currentJob.completed_at)}</div>
                              <div className="text-xs">Duur</div>
                            </div>
                          </div>

                          {/* Live Activity Log */}
                          {activityLog.length > 0 && (
                            <div className="text-sm">
                              <div className="flex items-center gap-2 font-medium text-primary mb-2">
                                <Activity className="h-4 w-4" />
                                Live Activiteit
                                {currentJob.status === 'running' && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                  </span>
                                )}
                              </div>
                              <ScrollArea className="h-48 rounded border bg-background/50">
                                <div ref={logScrollRef} className="p-2 space-y-1 font-mono text-xs">
                                  {activityLog.map((entry) => (
                                    <div 
                                      key={entry.id}
                                      className={`flex gap-2 ${
                                        entry.type === 'error' ? 'text-destructive' :
                                        entry.type === 'city' ? 'text-primary' :
                                        entry.type === 'restaurant' ? 'text-green-600' :
                                        entry.type === 'skip' ? 'text-amber-600' :
                                        'text-muted-foreground'
                                      }`}
                                    >
                                      <span className="text-muted-foreground/50 shrink-0">
                                        {entry.timestamp.toLocaleTimeString('nl-NL')}
                                      </span>
                                      <span>{entry.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}

                          {currentJob.errors && currentJob.errors.length > 0 && (
                            <div className="text-sm">
                              <p className="font-medium text-destructive mb-1">
                                Laatste 10 fouten ({currentJob.errors.length} totaal):
                              </p>
                              <ul className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1 bg-destructive/5 p-2 rounded">
                                {currentJob.errors.slice(-10).map((error, i) => (
                                  <li key={i} className="truncate font-mono">{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {currentJob?.status === 'running' ? (
                      <Button 
                        onClick={handleRefreshStatus}
                        className="flex-1"
                        variant="outline"
                        disabled={isLoadingStatus}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                        Ververs Status
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStartBulkImport}
                        className="flex-1"
                        disabled={isLoadingStatus}
                      >
                        {isLoadingStatus ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start Bulk Import
                      </Button>
                    )}
                    <Button 
                      onClick={handleRefreshStatus}
                      variant="ghost"
                      size="icon"
                      disabled={isLoadingStatus}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Dit kan ~5000+ API calls gebruiken. Max 5 restaurants per stad. 
                    De import draait door op de server, ook als je deze pagina verlaat.
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
