import { Link } from 'react-router-dom';
import { Store, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="container-wide relative">
        <div className="mx-auto max-w-3xl text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium mb-6">
            <Store className="h-4 w-4" />
            <span>Voor restauranthouders</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold">
            Heb je een restaurant?
          </h2>
          
          <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Voeg je restaurant toe aan Happio en bereik duizenden potentiële gasten. 
            Gratis en binnen 5 minuten geregeld.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Gratis vermelding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Beheer je reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Upload foto's</span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              asChild
              className="text-base px-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <Link to="/aanmelden">Restaurant aanmelden</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8" 
              asChild
            >
              <Link to="/claimen">Bestaand restaurant claimen</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
