import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurants } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export default function AdminRestaurantsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: restaurants, isLoading } = useRestaurants({ search: searchQuery });

  const allIds = useMemo(() => 
    restaurants?.restaurants?.map(r => r.id) || [], 
    [restaurants]
  );

  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // First get restaurant slugs and city slugs for folder paths
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, slug, city:cities(slug)')
        .in('id', ids);

      // Delete photos from storage for each restaurant
      for (const restaurant of restaurantsData || []) {
        const citySlug = (restaurant.city as any)?.slug || 'unknown';
        const folderPath = `${citySlug}/${restaurant.slug}`;
        
        // List all files in the restaurant folder
        const { data: files } = await supabase.storage
          .from('restaurant-photos')
          .list(folderPath);
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${folderPath}/${f.name}`);
          await supabase.storage
            .from('restaurant-photos')
            .remove(filePaths);
        }
      }

      // Delete from restaurant_photos table
      await supabase
        .from('restaurant_photos')
        .delete()
        .in('restaurant_id', ids);

      // Delete from restaurant_cuisines table
      await supabase
        .from('restaurant_cuisines')
        .delete()
        .in('restaurant_id', ids);

      // Delete from reviews table
      await supabase
        .from('reviews')
        .delete()
        .in('restaurant_id', ids);

      // Delete from favorites table
      await supabase
        .from('favorites')
        .delete()
        .in('restaurant_id', ids);

      // Delete from restaurant_claims table
      await supabase
        .from('restaurant_claims')
        .delete()
        .in('restaurant_id', ids);

      // Finally delete the restaurants
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} restaurant(s) verwijderd`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Fout bij verwijderen van restaurants');
    },
  });

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(Array.from(selectedIds));
    setShowDeleteDialog(false);
  };

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  if (authLoading || !user || !isAdmin()) return null;

  return (
    <Layout title="Restaurants Beheren">
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8">
        <div className="container-wide">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Restaurants</h1>
              <p className="text-muted-foreground">Beheer alle restaurants</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin/import')}>
                <Plus className="mr-2 h-4 w-4" />
                Importeren
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} geselecteerd
                </span>
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Verwijderen ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Selecteer alle restaurants"
                      className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
                    />
                  </TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Stad</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : restaurants?.restaurants?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Geen restaurants gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurants?.restaurants?.map((restaurant) => (
                    <TableRow 
                      key={restaurant.id}
                      className={selectedIds.has(restaurant.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(restaurant.id)}
                          onCheckedChange={() => toggleOne(restaurant.id)}
                          aria-label={`Selecteer ${restaurant.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {restaurant.image_url ? (
                            <img 
                              src={restaurant.image_url} 
                              alt={restaurant.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted" />
                          )}
                          <div>
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{restaurant.city?.name || '-'}</TableCell>
                      <TableCell>
                        {restaurant.rating ? (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            {restaurant.rating.toFixed(1)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {restaurant.is_verified && (
                            <Badge variant="default">Geverifieerd</Badge>
                          )}
                          {restaurant.is_claimed && (
                            <Badge variant="secondary">Geclaimd</Badge>
                          )}
                          {!restaurant.is_verified && !restaurant.is_claimed && (
                            <Badge variant="outline">Nieuw</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/${restaurant.city?.slug}/${restaurant.slug}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/restaurants/${restaurant.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedIds(new Set([restaurant.id]));
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurant(s) verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je {selectedIds.size} restaurant(s) wilt verwijderen? 
              Dit verwijdert ook alle foto's, reviews en andere gerelateerde data. 
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
