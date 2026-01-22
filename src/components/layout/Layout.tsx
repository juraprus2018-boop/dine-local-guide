import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Helmet } from 'react-helmet-async';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  noFooter?: boolean;
  image?: string;
  type?: 'website' | 'article' | 'restaurant';
  jsonLd?: object | object[];
  noIndex?: boolean;
}

export function Layout({ 
  children, 
  title, 
  description, 
  noFooter = false,
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
}: LayoutProps) {
  const location = useLocation();
  const baseUrl = 'https://www.mijn-restaurant.nl';
  const canonicalUrl = `${baseUrl}${location.pathname}`;
  
  const pageTitle = title ? `${title} | Mijn Restaurant` : 'Mijn Restaurant - Ontdek de beste restaurants in Nederland';
  const pageDescription = description || 'Vind en ontdek de beste restaurants, cafés en eetgelegenheden in jouw stad. Lees reviews, bekijk foto\'s en vind jouw perfecte eetplek.';
  const pageImage = image || `${baseUrl}/og-image.png`;

  // Default organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mijn Restaurant",
    "url": baseUrl,
    "logo": `${baseUrl}/mijn-restaurant-logo.png`,
    "description": "Mijn Restaurant is het platform voor het ontdekken van de beste restaurants in Nederland.",
    "sameAs": []
  };

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Mijn Restaurant",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/zoeken?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="author" content="Mijn Restaurant" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Robots */}
        {noIndex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        )}
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:site_name" content="Mijn Restaurant" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        {jsonLd && (
          Array.isArray(jsonLd) ? (
            jsonLd.map((schema, index) => (
              <script key={index} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            ))
          ) : (
            <script type="application/ld+json">
              {JSON.stringify(jsonLd)}
            </script>
          )
        )}
      </Helmet>
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">{children}</main>
        {!noFooter && <Footer />}
      </div>
    </>
  );
}
