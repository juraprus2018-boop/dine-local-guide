import { Layout } from '@/components/layout';

export default function CookiesPage() {
  return (
    <Layout
      title="Cookiebeleid"
      description="Lees ons cookiebeleid en hoe wij cookies gebruiken op Happio."
    >
      <div className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl font-bold mb-8">Cookiebeleid</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">
              Laatst bijgewerkt: 1 januari 2026
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">1. Wat zijn cookies?</h2>
            <p className="text-muted-foreground">
              Cookies zijn kleine tekstbestanden die op je apparaat worden geplaatst wanneer je onze website bezoekt. Ze helpen ons om je een betere ervaring te bieden en om te begrijpen hoe onze website wordt gebruikt.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">2. Welke cookies gebruiken we?</h2>
            
            <h3 className="font-semibold text-lg mt-6 mb-2">Noodzakelijke cookies</h3>
            <p className="text-muted-foreground">
              Deze cookies zijn essentieel voor het functioneren van de website. Ze maken functies mogelijk zoals inloggen en het onthouden van je voorkeuren.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-2">Analytische cookies</h3>
            <p className="text-muted-foreground">
              We gebruiken analytische cookies om te begrijpen hoe bezoekers onze website gebruiken. Dit helpt ons om de website te verbeteren.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-2">Functionele cookies</h3>
            <p className="text-muted-foreground">
              Deze cookies onthouden je voorkeuren, zoals je locatie voor het tonen van restaurants in de buurt.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">3. Cookies beheren</h2>
            <p className="text-muted-foreground">
              Je kunt cookies beheren via je browserinstellingen. Let op dat het uitschakelen van cookies de functionaliteit van onze website kan beïnvloeden.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">4. Third-party cookies</h2>
            <p className="text-muted-foreground">
              Sommige cookies worden geplaatst door derden, zoals analytische diensten. Deze partijen hebben hun eigen privacybeleid.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">5. Updates</h2>
            <p className="text-muted-foreground">
              We kunnen dit cookiebeleid periodiek bijwerken. Controleer deze pagina regelmatig voor de laatste informatie.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              Heb je vragen over ons cookiebeleid? Neem contact met ons op via info@happio.nl.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
