import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Eye, Users, Calendar, CalendarDays } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [days, setDays] = useState(30);

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  // Get all restaurants for filter
  const { data: restaurants } = useQuery({
    queryKey: ['all-restaurants-for-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Get page view stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-analytics-stats', selectedRestaurant],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      let query = supabase
        .from('page_views')
        .select('id, created_at, ip_hash, page_type');

      if (selectedRestaurant !== 'all') {
        query = query.eq('restaurant_id', selectedRestaurant);
      }

      const { data, error } = await query;
      if (error) throw error;

      const views = data || [];
      const today = views.filter(v => v.created_at >= startOfDay).length;
      const thisWeek = views.filter(v => v.created_at >= startOfWeek).length;
      const thisMonth = views.filter(v => v.created_at >= startOfMonth).length;
      const uniqueHashes = new Set(views.map(v => v.ip_hash));

      // Page type breakdown
      const pageTypes: Record<string, number> = {};
      views.forEach(v => {
        pageTypes[v.page_type] = (pageTypes[v.page_type] || 0) + 1;
      });

      return {
        total: views.length,
        today,
        thisWeek,
        thisMonth,
        uniqueVisitors: uniqueHashes.size,
        pageTypes,
      };
    },
    enabled: isAdmin,
  });

  // Get chart data
  const { data: chartData } = useQuery({
    queryKey: ['admin-analytics-chart', selectedRestaurant, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (selectedRestaurant !== 'all') {
        query = query.eq('restaurant_id', selectedRestaurant);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const grouped: Record<string, number> = {};
      (data || []).forEach(view => {
        const date = view.created_at.split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Fill in missing dates
      const result = [];
      const current = new Date(startDate);
      const now = new Date();
      while (current <= now) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          views: grouped[dateStr] || 0,
        });
        current.setDate(current.getDate() + 1);
      }

      return result;
    },
    enabled: isAdmin,
  });

  if (!user) {
    return (
      <Layout title="Admin - Analytics">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Log in om verder te gaan</h1>
          <Button asChild className="mt-4">
            <Link to="/auth">Inloggen</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (checkingAdmin) {
    return (
      <Layout title="Admin - Analytics">
        <div className="container-wide py-16">
          <div className="h-8 w-48 skeleton rounded mb-4" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Geen toegang">
        <div className="container-wide py-16 text-center">
          <h1 className="text-2xl font-semibold">Geen toegang</h1>
          <p className="text-muted-foreground mt-2">
            Je hebt geen toegang tot deze pagina.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Terug naar home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const pageTypeLabels: Record<string, string> = {
    home: 'Homepage',
    city: 'Stadspagina\'s',
    restaurant: 'Restaurantpagina\'s',
  };

  return (
    <Layout title="Admin - Analytics">
      <div className="container-wide py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Bekijk bezoekersstatistieken van de website
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter op restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle pagina's</SelectItem>
                {restaurants?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dagen</SelectItem>
                <SelectItem value="30">30 dagen</SelectItem>
                <SelectItem value="90">90 dagen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.today || 0}</p>
                  <p className="text-sm text-muted-foreground">Vandaag</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
                  <p className="text-sm text-muted-foreground">Deze week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Deze maand</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Totaal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.uniqueVisitors || 0}</p>
                  <p className="text-sm text-muted-foreground">Unieke bezoekers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bezoeken over tijd</CardTitle>
              <CardDescription>Aantal paginaweergaven per dag</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('nl-NL', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          });
                        }}
                        formatter={(value: number) => [value, 'Weergaven']}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nog geen data beschikbaar
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Pagina types</CardTitle>
              <CardDescription>Verdeling van bezoeken per type</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.pageTypes && Object.keys(stats.pageTypes).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.pageTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{pageTypeLabels[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Nog geen data beschikbaar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
