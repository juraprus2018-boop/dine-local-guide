import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

const blogPosts = [
  {
    title: 'De beste brunch spots in Amsterdam',
    excerpt: 'Ontdek de leukste plekken voor een uitgebreide brunch in de hoofdstad. Van avocado toast tot eggs benedict.',
    date: '2026-01-02',
    category: 'Tips',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=250&fit=crop',
  },
  {
    title: 'Nieuw in Rotterdam: 5 restaurants om te proberen',
    excerpt: 'Rotterdam heeft weer een aantal geweldige nieuwe restaurants. Wij zetten de beste nieuwkomers op een rij.',
    date: '2025-12-28',
    category: 'Nieuw',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
  },
  {
    title: 'Interview: Chef van het jaar 2025',
    excerpt: 'We spraken met de winnaar van Chef van het Jaar over zijn culinaire reis en toekomstplannen.',
    date: '2025-12-20',
    category: 'Interview',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=250&fit=crop',
  },
];

export default function BlogPage() {
  return (
    <Layout
      title="Blog"
      description="Lees het laatste nieuws over restaurants, food trends en culinaire tips op de Happio blog."
    >
      <div className="container-wide py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Het laatste nieuws, tips en trends uit de culinaire wereld
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <h2 className="font-display text-xl font-semibold leading-tight">
                  {post.title}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {post.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Meer artikelen komen binnenkort...
          </p>
        </div>
      </div>
    </Layout>
  );
}
