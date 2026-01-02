import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const placementLabels: Record<string, string> = {
  homepage: 'Homepage banner',
  city: 'Stadspagina banner',
  detail_sidebar: 'Restaurant sidebar',
  detail_content: 'Restaurant content',
};

export default function AdminAdsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    placement_type: 'homepage',
    ad_code: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  const { data: adPlacements, isLoading } = useQuery({
    queryKey: ['all-ad-placements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('ad_placements').insert({
        placement_type: data.placement_type,
        ad_code: data.ad_code || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-ad-placements'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Advertentie toegevoegd');
    },
    onError: () => {
      toast.error('Er ging iets mis');
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('ad_placements')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-ad-placements'] });
      setEditingAd(null);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Advertentie bijgewerkt');
    },
    onError: () => {
      toast.error('Er ging iets mis');
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_placements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-ad-placements'] });
      toast.success('Advertentie verwijderd');
    },
    onError: () => {
      toast.error('Er ging iets mis');
    },
  });

  const resetForm = () => {
    setFormData({
      placement_type: 'homepage',
      ad_code: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      placement_type: ad.placement_type,
      ad_code: ad.ad_code || '',
      start_date: ad.start_date || '',
      end_date: ad.end_date || '',
      is_active: ad.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createAdMutation.mutate(formData);
    }
  };

  const toggleActive = (id: string, currentStatus: boolean) => {
    updateAdMutation.mutate({ id, data: { is_active: !currentStatus } });
  };

  if (!user) {
    return (
      <Layout title="Admin - Advertenties">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Log in om verder te gaan</h1>
          <Button asChild className="mt-4">
            <Link to="/auth">Inloggen</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (checkingAdmin) {
    return (
      <Layout title="Admin - Advertenties">
        <div className="container-wide py-16">
          <div className="h-8 w-48 skeleton rounded mb-4" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Geen toegang">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Geen toegang</h1>
          <p className="text-muted-foreground mt-2">
            Je hebt geen toegang tot deze pagina.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Terug naar home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin - Advertenties beheren">
      <div className="container-wide py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Advertenties beheren</h1>
            <p className="mt-2 text-muted-foreground">
              Beheer Google Ads plaatsingen op de website
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nieuwe advertentie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? 'Advertentie bewerken' : 'Nieuwe advertentie'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="placement">Plaatsing</Label>
                  <Select
                    value={formData.placement_type}
                    onValueChange={(value) => setFormData({ ...formData, placement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homepage">Homepage banner</SelectItem>
                      <SelectItem value="city">Stadspagina banner</SelectItem>
                      <SelectItem value="detail_sidebar">Restaurant sidebar</SelectItem>
                      <SelectItem value="detail_content">Restaurant content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ad_code">Google Ads code</Label>
                  <Textarea
                    id="ad_code"
                    placeholder="Plak hier je Google Ads code..."
                    value={formData.ad_code}
                    onChange={(e) => setFormData({ ...formData, ad_code: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kopieer de volledige ad code van Google Ads
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Startdatum</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Einddatum</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Actief</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createAdMutation.isPending || updateAdMutation.isPending}>
                    {editingAd ? 'Opslaan' : 'Toevoegen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Alle advertenties
            </CardTitle>
            <CardDescription>
              Beheer advertentieplaatsingen op homepage, stadspagina's en restaurantpagina's
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 skeleton rounded-lg" />
                ))}
              </div>
            ) : adPlacements && adPlacements.length > 0 ? (
              <div className="space-y-3">
                {adPlacements.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                        {ad.is_active ? 'Actief' : 'Inactief'}
                      </Badge>
                      <div>
                        <p className="font-medium">{placementLabels[ad.placement_type]}</p>
                        <p className="text-sm text-muted-foreground">
                          {ad.start_date && ad.end_date 
                            ? `${ad.start_date} - ${ad.end_date}`
                            : 'Geen datum ingesteld'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(ad.id, ad.is_active)}
                      >
                        {ad.is_active ? 'Deactiveren' : 'Activeren'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAdMutation.mutate(ad.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nog geen advertenties</p>
                <p className="text-sm">Voeg je eerste Google Ads plaatsing toe</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
