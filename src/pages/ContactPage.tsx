import { useState, useRef } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import ReCaptcha, { ReCaptchaRef } from '@/components/ReCaptcha';
import { verifyRecaptcha } from '@/hooks/useRecaptcha';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Bericht verzonden! We nemen zo snel mogelijk contact met je op.');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
    setIsSubmitting(false);
  };

  return (
    <Layout
      title="Contact"
      description="Neem contact op met Mijn Restaurant. Wij staan klaar om je te helpen met al je vragen."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold">Contact</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Heb je een vraag of opmerking? Wij horen graag van je!
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href="mailto:info@mijn-restaurant.nl" className="text-muted-foreground hover:text-primary">
                      info@mijn-restaurant.nl
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Adres</h3>
                    <p className="text-muted-foreground">
                      Amsterdam, Nederland
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Stuur ons een bericht</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Onderwerp</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <ReCaptcha
                    ref={recaptchaRef}
                    onChange={setRecaptchaToken}
                    className="flex justify-center"
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting || !recaptchaToken}>
                    {isSubmitting ? 'Verzenden...' : 'Verstuur bericht'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
