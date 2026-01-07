import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import eatspotLogo from "@/assets/eatspot-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-block">
          <img src={eatspotLogo} alt="Eatspot" className="h-10" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="text-center max-w-lg">
          {/* 404 illustration */}
          <div className="relative mb-8">
            <div className="text-[180px] font-bold text-primary/10 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary/10 rounded-full p-6">
                <Search className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Oeps! Pagina niet gevonden
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            De pagina die je zoekt bestaat niet of is verplaatst. 
            Geen zorgen, we helpen je de weg terug te vinden!
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="w-5 h-5" />
                Naar homepagina
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/ontdek">
                <MapPin className="w-5 h-5" />
                Ontdek restaurants
              </Link>
            </Button>
          </div>

          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="mt-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ga terug naar vorige pagina
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Eatspot. Alle rechten voorbehouden.</p>
      </footer>
    </div>
  );
};

export default NotFound;
