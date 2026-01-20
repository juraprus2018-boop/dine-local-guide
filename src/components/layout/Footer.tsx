import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import mijnRestaurantLogo from '@/assets/mijn-restaurant-logo.png';

const footerLinks = {
  ontdek: [
    { label: 'Populaire steden', href: '/ontdek' },
    { label: 'Alle keukens', href: '/keukens' },
    { label: 'Nieuw toegevoegd', href: '/nieuw' },
    { label: 'Top beoordeeld', href: '/top' },
  ],
  eigenaar: [
    { label: 'Restaurant aanmelden', href: '/aanmelden' },
    { label: 'Restaurant claimen', href: '/claimen' },
    { label: 'Eigenaar dashboard', href: '/eigenaar' },
  ],
  over: [
    { label: 'Over Mijn Restaurant', href: '/over' },
    { label: 'Contact', href: '/contact' },
    { label: 'Veelgestelde vragen', href: '/faq' },
    { label: 'Blog', href: '/blog' },
  ],
  juridisch: [
    { label: 'Privacybeleid', href: '/privacy' },
    { label: 'Algemene voorwaarden', href: '/voorwaarden' },
    { label: 'Cookiebeleid', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Mail, href: 'mailto:info@mijn-restaurant.nl', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/">
              <img src={mijnRestaurantLogo} alt="Mijn Restaurant" className="h-28 md:h-32" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Ontdek de beste restaurants in Nederland. Van gezellige eetcafés tot sterrenrestaurants.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold">Ontdek</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.ontdek.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Voor eigenaren</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.eigenaar.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Over ons</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.over.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Juridisch</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.juridisch.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mijn Restaurant. Alle rechten voorbehouden.
          </p>
          <p className="text-sm text-muted-foreground">
            Met ❤️ gemaakt in Nederland
          </p>
        </div>
      </div>
    </footer>
  );
}
