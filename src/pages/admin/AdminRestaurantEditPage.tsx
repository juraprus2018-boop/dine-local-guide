import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useCuisines } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminRestaurantEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { data: allCuisines } = useCuisines();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [cuisineIds, setCuisineIds] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    async function fetchRestaurant() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          city:cities(*),
          cuisines:restaurant_cuisines(cuisine_id)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Restaurant niet gevonden');
        navigate('/admin/restaurants');
        return;
      }

      setRestaurant(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setAddress(data.address || '');
      setPostalCode(data.postal_code || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      setPriceRange(data.price_range || '');
      setIsVerified(data.is_verified || false);
      setIsClaimed(data.is_claimed || false);
      setMetaTitle(data.meta_title || '');
      setMetaDescription(data.meta_description || '');
      setCuisineIds(data.cuisines?.map((c: any) => c.cuisine_id) || []);
      setIsLoading(false);
    }

    fetchRestaurant();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Update restaurant
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          name,
          description,
          address,
          postal_code: postalCode,
          phone,
          email,
          website,
        price_range: (priceRange || null) as '€' | '€€' | '€€€' | '€€€€' | null,
        is_verified: isVerified,
        is_claimed: isClaimed,
        meta_title: metaTitle,
        meta_description: metaDescription,
      })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update cuisines - delete old and insert new
      await supabase
        .from('restaurant_cuisines')
        .delete()
        .eq('restaurant_id', id);

      if (cuisineIds.length > 0) {
        await supabase
          .from('restaurant_cuisines')
          .insert(cuisineIds.map(cuisineId => ({
            restaurant_id: id,
            cuisine_id: cuisineId,
          })));
      }

      toast.success('Restaurant opgeslagen!');
      navigate('/admin/restaurants');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCuisine = (cuisineId: string) => {
    setCuisineIds(prev => 
      prev.includes(cuisineId)
        ? prev.filter(id => id !== cuisineId)
        : [...prev, cuisineId]
    );
  };

  if (authLoading || !user || !isAdmin()) return null;

  if (isLoading) {
    return (
      <Layout title="Restaurant Bewerken">
        <div className="container-wide py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${name} bewerken`}>
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8">
        <div className="container-wide">
          <Button variant="ghost" onClick={() => navigate('/admin/restaurants')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Restaurant Bewerken</h1>
              <p className="text-muted-foreground">{restaurant?.city?.name}</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Opslaan
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basisgegevens</CardTitle>
                <CardDescription>Naam, beschrijving en contactgegevens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naam</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoon</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Prijsklasse</Label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer prijsklasse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="€">€ - Budget</SelectItem>
                      <SelectItem value="€€">€€ - Gemiddeld</SelectItem>
                      <SelectItem value="€€€">€€€ - Duur</SelectItem>
                      <SelectItem value="€€€€">€€€€ - Luxe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Cuisines & Status */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Keukens</CardTitle>
                  <CardDescription>Selecteer alle toepasselijke keukens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {allCuisines?.map((cuisine) => (
                      <Button
                        key={cuisine.id}
                        variant={cuisineIds.includes(cuisine.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCuisine(cuisine.id)}
                      >
                        {cuisine.icon} {cuisine.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Verificatie en claim status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Geverifieerd</Label>
                      <p className="text-sm text-muted-foreground">Restaurant is gecontroleerd door Happio</p>
                    </div>
                    <Switch checked={isVerified} onCheckedChange={setIsVerified} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Geclaimd</Label>
                      <p className="text-sm text-muted-foreground">Eigenaar heeft dit restaurant geclaimd</p>
                    </div>
                    <Switch checked={isClaimed} onCheckedChange={setIsClaimed} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>Zoekmachine optimalisatie</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Titel</Label>
                    <Input
                      id="metaTitle"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Titel voor zoekmachines"
                    />
                    <p className="text-xs text-muted-foreground">{metaTitle.length}/60 tekens</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Beschrijving</Label>
                    <Textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Beschrijving voor zoekmachines"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{metaDescription.length}/160 tekens</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
