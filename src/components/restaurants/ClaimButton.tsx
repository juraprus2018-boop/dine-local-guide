import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface ClaimButtonProps {
  restaurantId: string;
  restaurantName: string;
  isClaimed?: boolean;
}

export function ClaimButton({ restaurantId, restaurantName, isClaimed }: ClaimButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Je moet ingelogd zijn');
      if (!businessEmail) throw new Error('Zakelijk e-mailadres is verplicht');

      const { error } = await supabase
        .from('restaurant_claims')
        .insert({
          restaurant_id: restaurantId,
          user_id: user.id,
          business_email: businessEmail,
          phone: phone || null,
          message: message || null,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Claim ingediend! We nemen zo snel mogelijk contact op.');
      setOpen(false);
      setBusinessEmail('');
      setPhone('');
      setMessage('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isClaimed) {
    return null;
  }

  if (!user) {
    return (
      <Button variant="outline" onClick={() => toast.info('Log in om dit restaurant te claimen')}>
        <Flag className="mr-2 h-4 w-4" />
        Eigenaar? Claim dit restaurant
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Flag className="mr-2 h-4 w-4" />
          Eigenaar? Claim dit restaurant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim {restaurantName}</DialogTitle>
          <DialogDescription>
            Bent u de eigenaar van dit restaurant? Vul onderstaande gegevens in om uw restaurant te claimen.
            Na verificatie kunt u de informatie beheren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessEmail">Zakelijk e-mailadres *</Label>
            <Input
              id="businessEmail"
              type="email"
              placeholder="info@uwrestaurant.nl"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+31 6 12345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Aanvullende informatie</Label>
            <Textarea
              id="message"
              placeholder="Optionele toelichting..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            onClick={() => claimMutation.mutate()}
            disabled={!businessEmail || claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verzenden...
              </>
            ) : (
              'Claim indienen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
