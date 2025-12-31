import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Major Dutch cities with coordinates
const DUTCH_CITIES = [
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, province: "Noord-Holland" },
  { name: "Rotterdam", lat: 51.9244, lng: 4.4777, province: "Zuid-Holland" },
  { name: "Den Haag", lat: 52.0705, lng: 4.3007, province: "Zuid-Holland" },
  { name: "Utrecht", lat: 52.0907, lng: 5.1214, province: "Utrecht" },
  { name: "Eindhoven", lat: 51.4416, lng: 5.4697, province: "Noord-Brabant" },
  { name: "Groningen", lat: 53.2194, lng: 6.5665, province: "Groningen" },
  { name: "Tilburg", lat: 51.5555, lng: 5.0913, province: "Noord-Brabant" },
  { name: "Almere", lat: 52.3508, lng: 5.2647, province: "Flevoland" },
  { name: "Breda", lat: 51.5719, lng: 4.7683, province: "Noord-Brabant" },
  { name: "Nijmegen", lat: 51.8126, lng: 5.8372, province: "Gelderland" },
  { name: "Apeldoorn", lat: 52.2112, lng: 5.9699, province: "Gelderland" },
  { name: "Haarlem", lat: 52.3874, lng: 4.6462, province: "Noord-Holland" },
  { name: "Arnhem", lat: 51.9851, lng: 5.8987, province: "Gelderland" },
  { name: "Enschede", lat: 52.2215, lng: 6.8937, province: "Overijssel" },
  { name: "Amersfoort", lat: 52.1561, lng: 5.3878, province: "Utrecht" },
  { name: "Zaanstad", lat: 52.4559, lng: 4.8286, province: "Noord-Holland" },
  { name: "Den Bosch", lat: 51.6998, lng: 5.3049, province: "Noord-Brabant" },
  { name: "Zwolle", lat: 52.5168, lng: 6.0830, province: "Overijssel" },
  { name: "Leiden", lat: 52.1601, lng: 4.4970, province: "Zuid-Holland" },
  { name: "Maastricht", lat: 50.8514, lng: 5.6910, province: "Limburg" },
  { name: "Dordrecht", lat: 51.8133, lng: 4.6901, province: "Zuid-Holland" },
  { name: "Zoetermeer", lat: 52.0575, lng: 4.4931, province: "Zuid-Holland" },
  { name: "Deventer", lat: 52.2549, lng: 6.1600, province: "Overijssel" },
  { name: "Alkmaar", lat: 52.6324, lng: 4.7534, province: "Noord-Holland" },
  { name: "Delft", lat: 52.0116, lng: 4.3571, province: "Zuid-Holland" },
  { name: "Venlo", lat: 51.3704, lng: 6.1724, province: "Limburg" },
  { name: "Leeuwarden", lat: 53.2012, lng: 5.7999, province: "Friesland" },
  { name: "Hilversum", lat: 52.2292, lng: 5.1669, province: "Noord-Holland" },
  { name: "Heerlen", lat: 50.8882, lng: 5.9795, province: "Limburg" },
  { name: "Oss", lat: 51.7650, lng: 5.5180, province: "Noord-Brabant" },
  { name: "Sittard", lat: 51.0000, lng: 5.8667, province: "Limburg" },
  { name: "Roosendaal", lat: 51.5308, lng: 4.4653, province: "Noord-Brabant" },
  { name: "Helmond", lat: 51.4758, lng: 5.6611, province: "Noord-Brabant" },
  { name: "Purmerend", lat: 52.5050, lng: 4.9597, province: "Noord-Holland" },
  { name: "Schiedam", lat: 51.9225, lng: 4.3897, province: "Zuid-Holland" },
  { name: "Spijkenisse", lat: 51.8450, lng: 4.3292, province: "Zuid-Holland" },
  { name: "Vlaardingen", lat: 51.9125, lng: 4.3419, province: "Zuid-Holland" },
  { name: "Almelo", lat: 52.3567, lng: 6.6625, province: "Overijssel" },
  { name: "Gouda", lat: 52.0115, lng: 4.7104, province: "Zuid-Holland" },
  { name: "Hoorn", lat: 52.6424, lng: 5.0594, province: "Noord-Holland" },
  { name: "Ede", lat: 52.0404, lng: 5.6648, province: "Gelderland" },
  { name: "Bergen op Zoom", lat: 51.4949, lng: 4.2911, province: "Noord-Brabant" },
  { name: "Capelle aan den IJssel", lat: 51.9292, lng: 4.5783, province: "Zuid-Holland" },
  { name: "Veenendaal", lat: 52.0275, lng: 5.5583, province: "Utrecht" },
  { name: "Katwijk", lat: 52.2000, lng: 4.4167, province: "Zuid-Holland" },
  { name: "Assen", lat: 52.9925, lng: 6.5625, province: "Drenthe" },
  { name: "Nieuwegein", lat: 52.0333, lng: 5.0833, province: "Utrecht" },
  { name: "Zeist", lat: 52.0833, lng: 5.2333, province: "Utrecht" },
  { name: "Harderwijk", lat: 52.3500, lng: 5.6167, province: "Gelderland" },
  { name: "Emmen", lat: 52.7792, lng: 6.8958, province: "Drenthe" },
];

// Cuisine type mapping from Google to our slugs
const CUISINE_MAPPING: Record<string, string> = {
  'italian_restaurant': 'italiaans',
  'chinese_restaurant': 'chinees',
  'japanese_restaurant': 'japans',
  'thai_restaurant': 'thais',
  'indian_restaurant': 'indiaas',
  'mexican_restaurant': 'mexicaans',
  'french_restaurant': 'frans',
  'greek_restaurant': 'grieks',
  'spanish_restaurant': 'spaans',
  'turkish_restaurant': 'turks',
  'american_restaurant': 'amerikaans',
  'mediterranean_restaurant': 'mediterraans',
  'indonesian_restaurant': 'indonesisch',
  'steak_house': 'steakhouse',
  'seafood_restaurant': 'visrestaurant',
  'vegetarian_restaurant': 'vegetarisch',
  'vegan_restaurant': 'vegan',
  'sushi_restaurant': 'japans',
  'pizza_restaurant': 'italiaans',
};

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  citySlug: string,
  restaurantSlug: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const fileName = `${citySlug}/${restaurantSlug}/${restaurantSlug}-${citySlug}-happio.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Image download/upload error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { startIndex = 0, batchSize = 5 } = await req.json();

    // Get cities to process in this batch
    const citiesToProcess = DUTCH_CITIES.slice(startIndex, startIndex + batchSize);
    
    if (citiesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alle steden zijn verwerkt!',
          completed: true,
          totalCities: DUTCH_CITIES.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];

    for (const cityData of citiesToProcess) {
      console.log(`Processing city: ${cityData.name}`);
      
      // Create or get city
      const citySlug = createSlug(cityData.name);
      let cityId: string;

      const { data: existingCity } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', citySlug)
        .maybeSingle();

      if (existingCity) {
        cityId = existingCity.id;
      } else {
        const { data: newCity, error: cityError } = await supabase
          .from('cities')
          .insert({
            name: cityData.name,
            slug: citySlug,
            province: cityData.province,
            latitude: cityData.lat,
            longitude: cityData.lng,
            description: `Ontdek de beste restaurants in ${cityData.name}, ${cityData.province}. Van gezellige eetcafés tot fine dining.`,
            meta_title: `Beste Restaurants ${cityData.name} | Reviews & Menu's | Happio`,
            meta_description: `Vind de ${cityData.name} beste restaurants. Lees reviews, bekijk menu's en reserveer direct. ✓ Actuele openingstijden ✓ Foto's ✓ Beoordelingen`,
          })
          .select('id')
          .single();

        if (cityError) {
          console.error(`Error creating city ${cityData.name}:`, cityError);
          continue;
        }
        cityId = newCity.id;
      }

      // Search for restaurants in this city
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${cityData.lat},${cityData.lng}&radius=5000&type=restaurant&key=${GOOGLE_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.status !== 'OK' || !searchData.results) {
        console.log(`No results for ${cityData.name}: ${searchData.status}`);
        results.push({ city: cityData.name, imported: 0, error: searchData.status });
        continue;
      }

      // Get top 5 restaurants by rating
      const topRestaurants = searchData.results
        .filter((r: any) => r.rating >= 3.5)
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      let importedCount = 0;

      for (const place of topRestaurants) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', place.place_id)
          .maybeSingle();

        if (existing) {
          console.log(`Restaurant ${place.name} already exists, skipping`);
          continue;
        }

        // Get place details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,photos,types,geometry&key=${GOOGLE_API_KEY}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status !== 'OK') {
          console.log(`Could not get details for ${place.name}`);
          continue;
        }

        const details = detailsData.result;
        const restaurantSlug = createSlug(details.name);

        // Download and upload photo
        let imageUrl = null;
        if (details.photos && details.photos.length > 0) {
          const photoRef = details.photos[0].photo_reference;
          const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
          imageUrl = await downloadAndUploadImage(supabase, googlePhotoUrl, citySlug, restaurantSlug);
        }

        // Map price level
        const priceRangeMap: Record<number, string> = {
          1: '€',
          2: '€€',
          3: '€€€',
          4: '€€€€',
        };

        // Normalize rating to 1-5 scale
        const normalizedRating = details.rating ? Math.round(details.rating) : null;

        // Insert restaurant
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            google_place_id: place.place_id,
            name: details.name,
            slug: restaurantSlug,
            description: `${details.name} is een restaurant in ${cityData.name}. Bekijk onze reviews, menu en openingstijden.`,
            address: details.formatted_address?.split(',')[0] || '',
            postal_code: details.formatted_address?.match(/\d{4}\s?[A-Z]{2}/)?.[0] || null,
            city_id: cityId,
            latitude: details.geometry?.location?.lat || cityData.lat,
            longitude: details.geometry?.location?.lng || cityData.lng,
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            price_range: details.price_level ? priceRangeMap[details.price_level] : null,
            rating: normalizedRating,
            review_count: details.user_ratings_total || 0,
            image_url: imageUrl,
            opening_hours: details.opening_hours?.weekday_text ? {} : null,
            features: [],
            meta_title: `${details.name} ${cityData.name} | ★ ${details.rating || 'N/A'}${details.price_level ? ' · ' + priceRangeMap[details.price_level] : ''} | Happio`,
            meta_description: `${details.name} in ${cityData.name}, ${cityData.province}. Beoordeling: ★ ${details.rating || 'N/A'}. Bekijk menu, openingstijden en reserveer online. ✓ Reviews ✓ Foto's`,
          })
          .select('id')
          .single();

        if (restaurantError) {
          console.error(`Error inserting restaurant ${details.name}:`, restaurantError);
          continue;
        }

        // Link cuisines based on Google types
        if (details.types && newRestaurant) {
          for (const type of details.types) {
            const cuisineSlug = CUISINE_MAPPING[type];
            if (cuisineSlug) {
              const { data: cuisine } = await supabase
                .from('cuisine_types')
                .select('id')
                .eq('slug', cuisineSlug)
                .maybeSingle();

              if (cuisine) {
                await supabase
                  .from('restaurant_cuisines')
                  .insert({
                    restaurant_id: newRestaurant.id,
                    cuisine_id: cuisine.id,
                  })
                  .select();
              }
            }
          }
        }

        importedCount++;
        console.log(`Imported: ${details.name} in ${cityData.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      results.push({ city: cityData.name, imported: importedCount });
    }

    const nextIndex = startIndex + batchSize;
    const hasMore = nextIndex < DUTCH_CITIES.length;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        nextIndex: hasMore ? nextIndex : null,
        hasMore,
        processed: Math.min(nextIndex, DUTCH_CITIES.length),
        totalCities: DUTCH_CITIES.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
