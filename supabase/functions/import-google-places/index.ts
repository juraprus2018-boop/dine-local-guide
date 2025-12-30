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
  vicinity?: string;
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
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface CityInfo {
  name: string;
  province: string | null;
  latitude: number;
  longitude: number;
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

function extractCityInfo(addressComponents: GooglePlace['address_components'], lat: number, lng: number): CityInfo | null {
  if (!addressComponents) return null;

  let cityName: string | null = null;
  let province: string | null = null;

  for (const component of addressComponents) {
    // City/town/village
    if (component.types.includes('locality') || 
        component.types.includes('sublocality') ||
        component.types.includes('postal_town')) {
      cityName = component.long_name;
    }
    // Province (administrative_area_level_1 in Netherlands)
    if (component.types.includes('administrative_area_level_1')) {
      province = component.long_name;
    }
  }

  if (!cityName) return null;

  return {
    name: cityName,
    province,
    latitude: lat,
    longitude: lng,
  };
}

function extractPostalCode(addressComponents: GooglePlace['address_components']): string | null {
  if (!addressComponents) return null;
  
  for (const component of addressComponents) {
    if (component.types.includes('postal_code')) {
      return component.long_name;
    }
  }
  return null;
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

    const { latitude, longitude, radius = 5000 } = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Missing required parameters: latitude, longitude');
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
    const citiesCreated: string[] = [];
    const cityCache: Map<string, string> = new Map(); // cityName -> cityId

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

        // Get place details for more info including address_components
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,formatted_phone_number,website,opening_hours,photos,types,address_components&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          errors.push(`${place.name}: Failed to get details`);
          continue;
        }

        const details = detailsData.result as GooglePlace;

        // Extract city information from address components
        const cityInfo = extractCityInfo(
          details.address_components, 
          details.geometry.location.lat, 
          details.geometry.location.lng
        );

        if (!cityInfo) {
          errors.push(`${place.name}: Could not extract city information`);
          continue;
        }

        // Check if city exists or create it
        let cityId: string;
        const cachedCityId = cityCache.get(cityInfo.name.toLowerCase());
        
        if (cachedCityId) {
          cityId = cachedCityId;
        } else {
          // Check database for existing city
          const citySlug = slugify(cityInfo.name);
          const { data: existingCity } = await supabase
            .from('cities')
            .select('id')
            .eq('slug', citySlug)
            .single();

          if (existingCity) {
            cityId = existingCity.id;
            cityCache.set(cityInfo.name.toLowerCase(), cityId);
          } else {
            // Create new city
            console.log(`Creating new city: ${cityInfo.name}, ${cityInfo.province}`);
            
            const { data: newCity, error: cityError } = await supabase
              .from('cities')
              .insert({
                name: cityInfo.name,
                slug: citySlug,
                province: cityInfo.province,
                latitude: cityInfo.latitude,
                longitude: cityInfo.longitude,
                description: `Ontdek de beste restaurants in ${cityInfo.name}${cityInfo.province ? `, ${cityInfo.province}` : ''}.`,
                meta_title: `Restaurants in ${cityInfo.name} | Happio`,
                meta_description: `Vind de beste restaurants in ${cityInfo.name}. Bekijk reviews, foto's en menu's van lokale eetgelegenheden.`,
              })
              .select()
              .single();

            if (cityError) {
              console.error(`Error creating city ${cityInfo.name}:`, cityError);
              errors.push(`${place.name}: Failed to create city ${cityInfo.name}`);
              continue;
            }

            cityId = newCity.id;
            cityCache.set(cityInfo.name.toLowerCase(), cityId);
            citiesCreated.push(`${cityInfo.name}${cityInfo.province ? ` (${cityInfo.province})` : ''}`);
          }
        }

        // Generate unique slug for restaurant
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
            'Sunday': 'sunday',
            'Maandag': 'monday',
            'Dinsdag': 'tuesday', 
            'Woensdag': 'wednesday',
            'Donderdag': 'thursday',
            'Vrijdag': 'friday',
            'Zaterdag': 'saturday',
            'Zondag': 'sunday'
          };
          
          for (const dayText of details.opening_hours.weekday_text) {
            const match = dayText.match(/^(\w+):\s*(.+)$/);
            if (match) {
              const dayKey = dayMap[match[1]];
              const timeStr = match[2];
              if (dayKey && timeStr !== 'Closed' && timeStr !== 'Gesloten') {
                const timeParts = timeStr.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
                if (timeParts) {
                  openingHours[dayKey] = { open: timeParts[1], close: timeParts[2] };
                }
              }
            }
          }
        }

        // Extract postal code
        const postalCode = extractPostalCode(details.address_components);

        // Insert restaurant
        const { data: restaurant, error: insertError } = await supabase
          .from('restaurants')
          .insert({
            name: details.name,
            slug,
            address: details.formatted_address,
            postal_code: postalCode,
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
            meta_title: `${details.name} | ${cityInfo.name} | Happio`,
            meta_description: `${details.name} in ${cityInfo.name}. Bekijk reviews, openingstijden en contactgegevens.`,
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

        imported.push(`${details.name} (${cityInfo.name})`);
        console.log(`Imported: ${details.name} in ${cityInfo.name}`);

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
        citiesCreated: citiesCreated.length,
        details: {
          imported,
          skipped,
          errors,
          citiesCreated,
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
