import { TrendingUp, Eye, Users, Calendar, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRestaurantAnalytics, useRestaurantAnalyticsChart } from '@/hooks/usePageViews';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface AnalyticsCardProps {
  restaurantId: string;
  restaurantName: string;
}

export function AnalyticsCard({ restaurantId, restaurantName }: AnalyticsCardProps) {
  const { data: stats, isLoading } = useRestaurantAnalytics(restaurantId);
  const { data: chartData } = useRestaurantAnalyticsChart(restaurantId, 30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bezoekersstatistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 skeleton rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Bezoekersstatistieken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Eye className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats?.today || 0}</p>
            <p className="text-xs text-muted-foreground">Vandaag</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
            <p className="text-xs text-muted-foreground">Deze week</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <CalendarDays className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Totaal</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">{stats?.uniqueVisitors || 0}</p>
            <p className="text-xs text-muted-foreground">Unieke bezoekers</p>
          </div>
        </div>

        {/* Chart */}
        {chartData && chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-4">Bezoeken afgelopen 30 dagen</h4>
            <div className="h-[200px]">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
