import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hash function for IP anonymization
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface TrackPageViewParams {
  pageType: 'restaurant' | 'city' | 'home';
  pageSlug?: string;
  restaurantId?: string;
}

// Common bot user agent patterns to filter out
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scrape/i, /headless/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /slurp/i, /duckduckbot/i, /semrush/i, /ahrefs/i,
  /mj12bot/i, /dotbot/i, /petalbot/i, /bytespider/i,
  /gptbot/i, /claudebot/i, /anthropic/i, /chatgpt/i,
  /lighthouse/i, /pagespeed/i, /gtmetrix/i,
  /pingdom/i, /uptimerobot/i, /statuscake/i,
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export function useTrackPageView({ pageType, pageSlug, restaurantId }: TrackPageViewParams) {
  useEffect(() => {
    const trackView = async () => {
      // Don't track bots
      if (isBot(navigator.userAgent)) {
        return;
      }

      try {
        // Create a session-based identifier (not persistent across sessions)
        const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
        sessionStorage.setItem('session_id', sessionId);
        
        const ipHash = await hashString(sessionId + navigator.userAgent);

        await supabase.from('page_views').insert({
          restaurant_id: restaurantId || null,
          page_type: pageType,
          page_slug: pageSlug || null,
          ip_hash: ipHash,
          user_agent: navigator.userAgent.substring(0, 500),
          referrer: document.referrer || null,
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the page
        console.error('Failed to track page view:', error);
      }
    };

    trackView();
  }, [pageType, pageSlug, restaurantId]);
}

interface PageViewStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  uniqueVisitors: number;
}

export function useRestaurantAnalytics(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant-analytics', restaurantId],
    queryFn: async (): Promise<PageViewStats> => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get all page views for this restaurant
      const { data, error } = await supabase
        .from('page_views')
        .select('id, created_at, ip_hash')
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      const views = data || [];
      const today = views.filter(v => v.created_at >= startOfDay).length;
      const thisWeek = views.filter(v => v.created_at >= startOfWeek).length;
      const thisMonth = views.filter(v => v.created_at >= startOfMonth).length;
      
      // Count unique visitors by ip_hash
      const uniqueHashes = new Set(views.map(v => v.ip_hash));

      return {
        total: views.length,
        today,
        thisWeek,
        thisMonth,
        uniqueVisitors: uniqueHashes.size,
      };
    },
    enabled: !!restaurantId,
  });
}

export function useRestaurantAnalyticsChart(restaurantId: string, days: number = 30) {
  return useQuery({
    queryKey: ['restaurant-analytics-chart', restaurantId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('page_views')
        .select('created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

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
    enabled: !!restaurantId,
  });
}
