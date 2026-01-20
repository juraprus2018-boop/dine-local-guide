import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout
      title="Over Mijn Restaurant"
      description="Leer meer over Mijn Restaurant - het platform voor het ontdekken van de beste restaurants in Nederland."
    >
      <div className="container-wide py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Over Mijn Restaurant
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Wij helpen je de beste restaurants in Nederland te ontdekken. Van gezellige eetcafés tot sterrenrestaurants.
          </p>
        </div>

        {/* Mission */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Onze Missie</h3>
              <p className="text-sm text-muted-foreground">
                Het makkelijker maken om geweldige eetplekken te vinden in heel Nederland.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">
                Gebouwd door en voor food lovers die hun ervaringen willen delen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Passie</h3>
              <p className="text-sm text-muted-foreground">
                Wij houden van lekker eten en willen dat met iedereen delen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Kwaliteit</h3>
              <p className="text-sm text-muted-foreground">
                Eerlijke reviews en betrouwbare informatie over elk restaurant.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Ons Verhaal
          </h2>
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p>
              Mijn Restaurant is ontstaan uit een simpele frustratie: het vinden van een goed restaurant zou niet zo moeilijk moeten zijn. Wij geloven dat iedereen toegang verdient tot eerlijke, betrouwbare informatie over restaurants in hun buurt.
            </p>
            <p className="mt-4">
              Of je nu op zoek bent naar een romantisch diner, een zakelijke lunch of gewoon een goede pizza, Mijn Restaurant helpt je de perfecte plek te vinden. Met duizenden restaurants, eerlijke reviews en handige filters vind je altijd wat je zoekt.
            </p>
            <p className="mt-4">
              Wij werken nauw samen met restauranteigenaren om ervoor te zorgen dat hun informatie altijd up-to-date is. Zo weet je zeker dat je de juiste keuze maakt.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
