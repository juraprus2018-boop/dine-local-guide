import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, MapPin, Utensils, Users, Star, FileCheck, Download, MessageSquare, BarChart3, Megaphone } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

  // Fetch actual stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [restaurants, cities, reviews, claims, pendingReviews, activeAds, pageViews] = await Promise.all([
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('cities').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('restaurant_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('ad_placements').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('page_views').select('id', { count: 'exact', head: true }),
      ]);
      return {
        restaurants: restaurants.count || 0,
        cities: cities.count || 0,
        reviews: reviews.count || 0,
        pendingClaims: claims.count || 0,
        pendingReviews: pendingReviews.count || 0,
        activeAds: activeAds.count || 0,
        totalPageViews: pageViews.count || 0,
      };
    },
    enabled: !!user && isAdmin(),
  });

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

  const statCards = [
    { label: 'Restaurants', value: stats?.restaurants ?? 0, icon: Utensils, href: '/admin/restaurants' },
    { label: 'Steden', value: stats?.cities ?? 0, icon: MapPin, href: '/admin/restaurants' },
    { label: 'Reviews', value: stats?.reviews ?? 0, icon: Star, href: '/admin/reviews' },
    { label: 'Pending Reviews', value: stats?.pendingReviews ?? 0, icon: MessageSquare, href: '/admin/reviews' },
    { label: 'Pending Claims', value: stats?.pendingClaims ?? 0, icon: FileCheck, href: '/admin/claims' },
    { label: 'Actieve Ads', value: stats?.activeAds ?? 0, icon: Megaphone, href: '/admin/advertenties' },
    { label: 'Paginaweergaven', value: stats?.totalPageViews ?? 0, icon: BarChart3, href: '/admin/analytics' },
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link key={stat.label} to={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
              </Link>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Restaurant Import
              </CardTitle>
              <CardDescription>
                Importeer restaurants via Google Places API. Klik op de kaart om een locatie te selecteren - 
                steden worden automatisch aangemaakt op basis van de API data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/import">
                  <MapPin className="mr-2 h-4 w-4" />
                  Open Import Tool
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Restaurants Beheren</CardTitle>
                <CardDescription>
                  Bekijk, bewerk en verwijder restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/admin/restaurants">Naar Restaurants</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Claims Beheren</CardTitle>
                <CardDescription>
                  Bekijk en behandel eigendomsclaims van restauranteigenaren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/admin/claims">Naar Claims</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews Beheren</CardTitle>
                <CardDescription>
                  Keur reviews goed of af voordat ze online komen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/admin/reviews">Naar Reviews</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  Bekijk bezoekersstatistieken en paginaweergaven
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/admin/analytics">Naar Analytics</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Advertenties
                </CardTitle>
                <CardDescription>
                  Beheer Google Ads scripts voor homepage, stadspagina's en detailpagina's
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/admin/advertenties">Naar Advertenties</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
