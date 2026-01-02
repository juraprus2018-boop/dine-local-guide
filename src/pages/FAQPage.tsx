import { Layout } from '@/components/layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Wat is Happio?',
    answer: 'Happio is een platform waar je de beste restaurants in Nederland kunt ontdekken. Je kunt reviews lezen, foto\'s bekijken en alle informatie vinden die je nodig hebt om de perfecte eetplek te kiezen.'
  },
  {
    question: 'Hoe kan ik een review plaatsen?',
    answer: 'Je kunt een review plaatsen door naar de pagina van een restaurant te gaan en het reviewformulier in te vullen. Je hoeft geen account te hebben - ook gasten kunnen reviews achterlaten.'
  },
  {
    question: 'Hoe kan ik mijn restaurant toevoegen?',
    answer: 'Ga naar de pagina "Restaurant aanmelden" in het menu. Vul het formulier in met alle informatie over je restaurant en we nemen contact met je op voor verificatie.'
  },
  {
    question: 'Hoe claim ik een bestaand restaurant?',
    answer: 'Als je restaurant al op Happio staat, kun je het claimen door op de "Claim dit restaurant" knop te klikken op de restaurantpagina. Je moet bewijzen dat je de eigenaar bent.'
  },
  {
    question: 'Zijn de reviews op Happio betrouwbaar?',
    answer: 'Alle reviews worden eerst gecontroleerd door onze moderators voordat ze worden gepubliceerd. We doen ons best om fake reviews te voorkomen en eerlijke feedback te garanderen.'
  },
  {
    question: 'Kost het geld om mijn restaurant op Happio te zetten?',
    answer: 'Nee, het is volledig gratis om je restaurant op Happio te vermelden. We bieden wel premium opties voor extra zichtbaarheid.'
  },
  {
    question: 'Hoe kan ik mijn restaurantgegevens bijwerken?',
    answer: 'Als je je restaurant hebt geclaimd, kun je inloggen en alle gegevens aanpassen via je eigenaar dashboard. Wijzigingen worden direct doorgevoerd.'
  },
  {
    question: 'Kan ik foto\'s uploaden?',
    answer: 'Ja! Zowel restauranteigenaren als bezoekers kunnen foto\'s uploaden. Eigenaren kunnen foto\'s beheren via het dashboard, bezoekers kunnen foto\'s toevoegen via de restaurantpagina.'
  },
];

export default function FAQPage() {
  return (
    <Layout
      title="Veelgestelde vragen"
      description="Vind antwoorden op veelgestelde vragen over Happio - het platform voor het ontdekken van restaurants."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold">Veelgestelde vragen</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Hier vind je antwoorden op de meest gestelde vragen
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
