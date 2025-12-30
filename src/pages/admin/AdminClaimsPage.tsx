import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { RestaurantClaim } from '@/types/database';

export default function AdminClaimsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedClaim, setSelectedClaim] = useState<RestaurantClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const { data: claims, isLoading } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_claims')
        .select(`
          *,
          restaurant:restaurants(id, name, slug, city:cities(slug))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (RestaurantClaim & { restaurant: { id: string; name: string; slug: string; city: { slug: string } } })[];
    },
    enabled: !!user && isAdmin(),
  });

  const approveMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const claim = claims?.find(c => c.id === claimId);
      if (!claim) throw new Error('Claim niet gevonden');

      // Update claim status
      const { error: claimError } = await supabase
        .from('restaurant_claims')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claimId);
      
      if (claimError) throw claimError;

      // Update restaurant owner
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
          owner_id: claim.user_id,
          is_claimed: true,
        })
        .eq('id', claim.restaurant_id);

      if (restaurantError) throw restaurantError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      toast.success('Claim goedgekeurd!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      const { error } = await supabase
        .from('restaurant_claims')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claimId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      setShowRejectDialog(false);
      setSelectedClaim(null);
      setRejectionReason('');
      toast.success('Claim afgewezen');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleReject = () => {
    if (selectedClaim && rejectionReason.trim()) {
      rejectMutation.mutate({ claimId: selectedClaim.id, reason: rejectionReason });
    }
  };

  if (authLoading || !user || !isAdmin()) return null;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Afgewezen</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />In afwachting</Badge>;
    }
  };

  return (
    <Layout title="Claims Beheren">
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8">
        <div className="container-wide">
          <h1 className="font-display text-3xl font-bold">Restaurant Claims</h1>
          <p className="text-muted-foreground">Beheer eigendomsclaims van restaurants</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Aanvrager</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Datum</TableHead>
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
                ) : claims?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Geen claims gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  claims?.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <p className="font-medium">{claim.restaurant?.name || 'Onbekend'}</p>
                      </TableCell>
                      <TableCell>{claim.phone || '-'}</TableCell>
                      <TableCell>{claim.business_email}</TableCell>
                      <TableCell>
                        {new Date(claim.created_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {claim.restaurant && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/${claim.restaurant.city.slug}/${claim.restaurant.slug}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {claim.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => approveMutation.mutate(claim.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedClaim(claim);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Afwijzen</DialogTitle>
            <DialogDescription>
              Geef een reden op voor het afwijzen van deze claim.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reden voor afwijzing..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              Afwijzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
