import { Utensils, Star, MapPin, TrendingUp } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';

interface HeroSectionProps {
  restaurantCount: number;
  reviewCount: number;
  cityCount: number;
}

export function HeroSection({ restaurantCount, reviewCount, cityCount }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 pt-16 md:pb-32 md:pt-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container-wide relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6 animate-fade-in">
            <TrendingUp className="h-4 w-4" />
            <span>De #1 restaurant gids van Nederland</span>
          </div>

          <h1 className="animate-fade-in text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Ontdek de{' '}
            <span className="text-gradient">beste restaurants</span>
            {' '}in Nederland
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1">
            Van gezellige eetcafés tot sterrenrestaurants. Vind jouw perfecte eetplek, 
            lees echte reviews en maak onvergetelijke herinneringen.
          </p>

          {/* Search Bar */}
          <div className="mt-10 animate-slide-up stagger-2">
            <SearchBar variant="hero" />
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto animate-fade-in stagger-3">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {restaurantCount.toLocaleString('nl-NL')}+
              </span>
              <span className="text-sm text-muted-foreground">restaurants</span>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 mb-3">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {reviewCount.toLocaleString('nl-NL')}+
              </span>
              <span className="text-sm text-muted-foreground">reviews</span>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {cityCount}+
              </span>
              <span className="text-sm text-muted-foreground">steden</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute -bottom-1 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
