import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Store, MapPin, Phone, Globe, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReCaptcha, { ReCaptchaRef } from '@/components/ReCaptcha';
import { verifyRecaptcha } from '@/hooks/useRecaptcha';

export default function RegisterRestaurantPage() {
  const { user } = useAuth();
  const { data: cities } = useCities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postalCode: '',
    cityId: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.cityId || !formData.ownerEmail) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    if (!recaptchaToken) {
      toast.error('Bevestig dat je geen robot bent');
      return;
    }

    setIsSubmitting(true);

    // Verify reCAPTCHA
    const isValid = await verifyRecaptcha(recaptchaToken);
    if (!isValid) {
      toast.error('reCAPTCHA verificatie mislukt. Probeer opnieuw.');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create a slug from the restaurant name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Get city coordinates for the restaurant (approximate)
      const selectedCity = cities?.find(c => c.id === formData.cityId);
      
      const { error } = await supabase
        .from('restaurants')
        .insert({
          name: formData.name,
          slug: `${slug}-${Date.now()}`, // Ensure unique slug
          address: formData.address,
          postal_code: formData.postalCode || null,
          city_id: formData.cityId,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          description: formData.description || null,
          latitude: selectedCity?.latitude || 52.3676,
          longitude: selectedCity?.longitude || 4.9041,
          is_claimed: false,
          is_verified: false,
          owner_id: user?.id || null,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Restaurant succesvol aangemeld!');
    } catch (error: any) {
      console.error('Error registering restaurant:', error);
      toast.error(error.message || 'Er is iets misgegaan bij het aanmelden');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout title="Restaurant aangemeld">
        <div className="container-narrow py-16 md:py-24">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Bedankt voor je aanmelding!</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Je restaurant is succesvol aangemeld. We controleren de gegevens en 
              nemen indien nodig contact met je op.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link to="/">Terug naar home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ontdek">Ontdek restaurants</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Restaurant aanmelden"
      description="Meld je restaurant gratis aan bij Happio en bereik duizenden potentiële gasten."
    >
      <div className="container-narrow py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Store className="h-4 w-4" />
            <span>Gratis aanmelden</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Restaurant aanmelden
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Voeg je restaurant toe aan Happio en bereik duizenden potentiële gasten. 
            Volledig gratis en binnen enkele minuten geregeld.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '✅', title: 'Gratis vermelding', desc: 'Geen kosten, geen verplichtingen' },
            { icon: '⭐', title: 'Beheer je reviews', desc: 'Reageer op beoordelingen' },
            { icon: '📸', title: 'Upload foto\'s', desc: 'Laat je restaurant zien' },
          ].map((benefit) => (
            <div key={benefit.title} className="p-4 rounded-xl bg-muted/50 text-center">
              <span className="text-2xl mb-2 block">{benefit.icon}</span>
              <h3 className="font-medium">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurantgegevens</CardTitle>
            <CardDescription>
              Vul de gegevens van je restaurant in. Velden met * zijn verplicht.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Info */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  Restaurant informatie
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Naam restaurant *</Label>
                    <Input
                      id="name"
                      placeholder="bijv. Restaurant De Gouden Lepel"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Beschrijving</Label>
                    <Textarea
                      id="description"
                      placeholder="Vertel iets over je restaurant..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Locatie
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Adres *</Label>
                    <Input
                      id="address"
                      placeholder="Straatnaam en huisnummer"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      placeholder="1234 AB"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Stad *</Label>
                    <Select value={formData.cityId} onValueChange={(value) => handleChange('cityId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een stad" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contactgegevens restaurant
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="020 123 4567"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@restaurant.nl"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.mijnrestaurant.nl"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Contactpersoon
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerName">Naam contactpersoon</Label>
                    <Input
                      id="ownerName"
                      placeholder="Jan Jansen"
                      value={formData.ownerName}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerEmail">E-mailadres *</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="jan@restaurant.nl"
                      value={formData.ownerEmail}
                      onChange={(e) => handleChange('ownerEmail', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="ownerPhone">Telefoonnummer</Label>
                    <Input
                      id="ownerPhone"
                      type="tel"
                      placeholder="06 12345678"
                      value={formData.ownerPhone}
                      onChange={(e) => handleChange('ownerPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <ReCaptcha
                ref={recaptchaRef}
                onChange={setRecaptchaToken}
                className="flex justify-center"
              />

              <div className="pt-4 border-t">
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !recaptchaToken}>
                  {isSubmitting ? 'Bezig met aanmelden...' : 'Restaurant aanmelden'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Door je aan te melden ga je akkoord met onze voorwaarden. 
                  Heb je al een restaurant op Happio?{' '}
                  <Link to="/claimen" className="text-primary hover:underline">
                    Claim je restaurant
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
