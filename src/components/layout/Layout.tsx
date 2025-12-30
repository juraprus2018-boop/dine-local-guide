import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Helmet } from 'react-helmet-async';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  noFooter?: boolean;
}

export function Layout({ children, title, description, noFooter = false }: LayoutProps) {
  const pageTitle = title ? `${title} | Happio` : 'Happio - Ontdek de beste restaurants in Nederland';
  const pageDescription = description || 'Vind en ontdek de beste restaurants, cafés en eetgelegenheden in jouw stad. Lees reviews, bekijk foto\'s en vind jouw perfecte eetplek.';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        {!noFooter && <Footer />}
      </div>
    </>
  );
}
