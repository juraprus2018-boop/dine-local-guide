import { Layout } from '@/components/layout';

export default function TermsPage() {
  return (
    <Layout
      title="Algemene voorwaarden"
      description="Lees onze algemene voorwaarden voor het gebruik van Happio."
    >
      <div className="container-wide py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl font-bold mb-8">Algemene voorwaarden</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">
              Laatst bijgewerkt: 1 januari 2026
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">1. Algemeen</h2>
            <p className="text-muted-foreground">
              Door gebruik te maken van Happio ga je akkoord met deze algemene voorwaarden. Lees ze zorgvuldig door voordat je onze diensten gebruikt.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">2. Dienstverlening</h2>
            <p className="text-muted-foreground">
              Happio biedt een platform voor het ontdekken van restaurants en het delen van ervaringen. Wij doen ons best om accurate informatie te verstrekken, maar kunnen niet garanderen dat alle informatie volledig en up-to-date is.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">3. Gebruikersgedrag</h2>
            <p className="text-muted-foreground">
              Als gebruiker van Happio stem je ermee in om:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Alleen eerlijke en waarheidsgetrouwe reviews te plaatsen</li>
              <li>Geen beledigende, discriminerende of illegale content te delen</li>
              <li>Geen spam of reclame te plaatsen</li>
              <li>De rechten van anderen te respecteren</li>
            </ul>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">4. Reviews en content</h2>
            <p className="text-muted-foreground">
              Door content (reviews, foto's) te plaatsen op Happio, geef je ons het recht om deze content te gebruiken op onze website en in marketingmaterialen. Je blijft eigenaar van je content.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">5. Moderatie</h2>
            <p className="text-muted-foreground">
              Wij behouden ons het recht voor om content te verwijderen die in strijd is met onze richtlijnen. Herhaalde overtredingen kunnen leiden tot het blokkeren van je account.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">6. Aansprakelijkheid</h2>
            <p className="text-muted-foreground">
              Happio is niet aansprakelijk voor de inhoud van reviews of andere door gebruikers geplaatste content. Wij zijn ook niet aansprakelijk voor eventuele schade die voortvloeit uit het gebruik van onze diensten.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">7. Wijzigingen</h2>
            <p className="text-muted-foreground">
              We kunnen deze voorwaarden op elk moment wijzigen. Wijzigingen worden van kracht zodra ze op deze pagina worden gepubliceerd.
            </p>

            <h2 className="font-display text-2xl font-semibold mt-8 mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              Heb je vragen over deze voorwaarden? Neem contact met ons op via info@happio.nl.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
