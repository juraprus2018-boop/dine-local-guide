import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapPriceLevel(level?: number): string | null {
  if (level === undefined) return null;
  const priceMap: Record<number, string> = {
    0: '€',
    1: '€',
    2: '€€',
    3: '€€€',
    4: '€€€€',
  };
  return priceMap[level] || '€€';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    const { latitude, longitude, radius = 5000, cityId } = await req.json();

    if (!latitude || !longitude || !cityId) {
      throw new Error('Missing required parameters: latitude, longitude, cityId');
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    console.log(`Searching for restaurants near ${latitude}, ${longitude} within ${radius}m`);

    // Search for restaurants using Google Places API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${googleApiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', searchData);
      throw new Error(`Google Places API error: ${searchData.status}`);
    }

    const places: GooglePlace[] = searchData.results || [];
    console.log(`Found ${places.length} restaurants`);

    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const place of places) {
      try {
        // Check if restaurant already exists
        const { data: existing } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', place.place_id)
          .single();

        if (existing) {
          skipped.push(place.name);
          continue;
        }

        // Get place details for more info
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,formatted_phone_number,website,opening_hours,photos,types&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          errors.push(`${place.name}: Failed to get details`);
          continue;
        }

        const details = detailsData.result as GooglePlace;

        // Generate unique slug
        let baseSlug = slugify(details.name);
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const { data: slugExists } = await supabase
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .single();
          
          if (!slugExists) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Get photo URL if available
        let imageUrl: string | null = null;
        if (details.photos && details.photos.length > 0) {
          imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${googleApiKey}`;
        }

        // Parse opening hours
        let openingHours: Record<string, { open: string; close: string }> | null = null;
        if (details.opening_hours?.weekday_text) {
          openingHours = {};
          const dayMap: Record<string, string> = {
            'Monday': 'monday',
            'Tuesday': 'tuesday', 
            'Wednesday': 'wednesday',
            'Thursday': 'thursday',
            'Friday': 'friday',
            'Saturday': 'saturday',
            'Sunday': 'sunday'
          };
          
          for (const dayText of details.opening_hours.weekday_text) {
            const match = dayText.match(/^(\w+):\s*(.+)$/);
            if (match) {
              const dayKey = dayMap[match[1]];
              const timeStr = match[2];
              if (dayKey && timeStr !== 'Closed') {
                const timeParts = timeStr.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
                if (timeParts) {
                  openingHours[dayKey] = { open: timeParts[1], close: timeParts[2] };
                }
              }
            }
          }
        }

        // Insert restaurant
        const { data: restaurant, error: insertError } = await supabase
          .from('restaurants')
          .insert({
            name: details.name,
            slug,
            address: details.formatted_address,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            city_id: cityId,
            google_place_id: place.place_id,
            rating: details.rating || 0,
            review_count: details.user_ratings_total || 0,
            price_range: mapPriceLevel(details.price_level),
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            image_url: imageUrl,
            opening_hours: openingHours,
            is_verified: false,
            is_claimed: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting ${details.name}:`, insertError);
          errors.push(`${details.name}: ${insertError.message}`);
          continue;
        }

        // Add primary photo if available
        if (imageUrl && restaurant) {
          await supabase
            .from('restaurant_photos')
            .insert({
              restaurant_id: restaurant.id,
              url: imageUrl,
              is_primary: true,
              is_approved: true,
            });
        }

        imported.push(details.name);
        console.log(`Imported: ${details.name}`);

      } catch (placeError: unknown) {
        const errorMsg = placeError instanceof Error ? placeError.message : 'Unknown error';
        console.error(`Error processing ${place.name}:`, placeError);
        errors.push(`${place.name}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          imported,
          skipped,
          errors,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
