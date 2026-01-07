import { Layout } from '@/components/layout';

export default function PrivacyPage() {
  return (
    <Layout
      title="Privacybeleid"
      description="Lees ons privacybeleid en hoe wij omgaan met je persoonlijke gegevens."
    >
      <div className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl font-bold mb-8">Privacybeleid</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">
              Laatst bijgewerkt: 1 januari 2026
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">1. Inleiding</h2>
            <p className="text-muted-foreground">
              Eatspot respecteert je privacy en zet zich in voor de bescherming van je persoonlijke gegevens. Dit privacybeleid legt uit hoe wij je gegevens verzamelen, gebruiken en beschermen.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">2. Gegevens die we verzamelen</h2>
            <p className="text-muted-foreground">
              We kunnen de volgende gegevens verzamelen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Naam en e-mailadres bij het aanmaken van een account</li>
              <li>Reviews en foto's die je plaatst</li>
              <li>Locatiegegevens (met je toestemming) voor het tonen van restaurants in de buurt</li>
              <li>Technische informatie zoals IP-adres en browsertype</li>
            </ul>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">3. Hoe we je gegevens gebruiken</h2>
            <p className="text-muted-foreground">
              We gebruiken je gegevens om:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Je toegang te geven tot onze diensten</li>
              <li>Je reviews en foto's te publiceren</li>
              <li>Je te informeren over updates en nieuwe functies</li>
              <li>Onze diensten te verbeteren</li>
            </ul>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">4. Delen van gegevens</h2>
            <p className="text-muted-foreground">
              We delen je persoonlijke gegevens niet met derden, behalve wanneer dit noodzakelijk is voor onze dienstverlening of wanneer we wettelijk verplicht zijn dit te doen.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">5. Je rechten</h2>
            <p className="text-muted-foreground">
              Je hebt het recht om:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Inzage te vragen in je persoonlijke gegevens</li>
              <li>Je gegevens te laten corrigeren of verwijderen</li>
              <li>Bezwaar te maken tegen de verwerking van je gegevens</li>
              <li>Je gegevens over te dragen naar een andere dienst</li>
            </ul>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              Heb je vragen over dit privacybeleid? Neem contact met ons op via info@eatspot.nl.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
