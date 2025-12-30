import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useEffect } from 'react';

export default function AdminRestaurantsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: restaurants, isLoading } = useRestaurants({ search: searchQuery });

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
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="text-center py-8">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : restaurants?.restaurants?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Geen restaurants gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurants?.restaurants?.map((restaurant) => (
                    <TableRow key={restaurant.id}>
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
                            onClick={() => toast.message('Bewerken komt binnenkort')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
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
    </Layout>
  );
}
