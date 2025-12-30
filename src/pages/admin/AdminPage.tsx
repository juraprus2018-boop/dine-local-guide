import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, MapPin, Utensils, Users, Star, FileCheck } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="container-wide py-8">
          <div className="h-8 w-48 skeleton rounded mb-8" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin()) return null;

  const stats = [
    { label: 'Restaurants', value: '0', icon: Utensils, href: '/admin/restaurants' },
    { label: 'Steden', value: '20', icon: MapPin, href: '/admin/cities' },
    { label: 'Gebruikers', value: '0', icon: Users, href: '/admin/users' },
    { label: 'Reviews', value: '0', icon: Star, href: '/admin/reviews' },
    { label: 'Claims', value: '0', icon: FileCheck, href: '/admin/claims' },
  ];

  return (
    <Layout title="Admin Dashboard">
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8">
        <div className="container-wide">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Beheer restaurants, steden en gebruikers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Restaurant Import</CardTitle>
              <CardDescription>
                Importeer restaurants via Google Places API. Voeg eerst een GOOGLE_PLACES_API_KEY toe aan de secrets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                De Google Places import functionaliteit vereist een API key. Ga naar Cloud settings om deze toe te voegen.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
