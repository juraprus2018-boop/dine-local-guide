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
  international_phone_number?: string;
  website?: string;
  url?: string;
  opening_hours?: {
    weekday_text?: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  editorial_summary?: {
    overview: string;
  };
}

interface CityInfo {
  name: string;
  province: string | null;
  latitude: number;
  longitude: number;
}

// Map Google place types to our cuisine types
const GOOGLE_TYPE_TO_CUISINE: Record<string, string> = {
  'american_restaurant': 'amerikaans',
  'chinese_restaurant': 'chinees',
  'french_restaurant': 'frans',
  'greek_restaurant': 'grieks',
  'indian_restaurant': 'indiaas',
  'indonesian_restaurant': 'indonesisch',
  'italian_restaurant': 'italiaans',
  'japanese_restaurant': 'japans',
  'mediterranean_restaurant': 'mediterraans',
  'mexican_restaurant': 'mexicaans',
  'spanish_restaurant': 'spaans',
  'steak_house': 'steakhouse',
  'thai_restaurant': 'thais',
  'turkish_restaurant': 'turks',
  'vegan_restaurant': 'vegan',
  'vegetarian_restaurant': 'vegetarisch',
  'seafood_restaurant': 'visrestaurant',
  'sushi_restaurant': 'japans',
  'ramen_restaurant': 'japans',
  'pizza_restaurant': 'italiaans',
  'hamburger_restaurant': 'amerikaans',
  'barbecue_restaurant': 'amerikaans',
  'asian_restaurant': 'indonesisch',
  'middle_eastern_restaurant': 'turks',
};

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
    if (component.types.includes('locality') || 
        component.types.includes('sublocality') ||
        component.types.includes('postal_town')) {
      cityName = component.long_name;
    }
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

function extractStreetAddress(addressComponents: GooglePlace['address_components']): string | null {
  if (!addressComponents) return null;
  
  let street = '';
  let number = '';
  
  for (const component of addressComponents) {
    if (component.types.includes('route')) {
      street = component.long_name;
    }
    if (component.types.includes('street_number')) {
      number = component.long_name;
    }
  }
  
  if (street && number) {
    return `${street} ${number}`;
  }
  return street || null;
}

async function downloadAndUploadPhoto(
  supabase: any,
  photoReference: string,
  googleApiKey: string,
  restaurantName: string,
  restaurantSlug: string,
  cityName: string,
  citySlug: string,
  photoIndex: number
): Promise<{ url: string; alt: string } | null> {
  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${googleApiKey}`;
    
    const response = await fetch(photoUrl);
    if (!response.ok) {
      console.error(`Failed to fetch photo: ${response.status}`);
      return null;
    }
    
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // New naming: restaurant-name-city-happio.jpg
    const baseName = `${restaurantSlug}-${citySlug}-happio`;
    const fileName = photoIndex === 0 
      ? `${baseName}.jpg`
      : `${baseName}-${photoIndex + 1}.jpg`;
    
    // Folder structure: city-slug/restaurant-slug/
    const filePath = `${citySlug}/${restaurantSlug}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`Upload error for ${fileName}:`, uploadError);
      return null;
    }
    
    const { data: publicUrl } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(filePath);
    
    // SEO-friendly alt text with restaurant name and city
    const altText = photoIndex === 0 
      ? `${restaurantName} restaurant ${cityName} - Happio`
      : `${restaurantName} ${cityName} foto ${photoIndex + 1} - Happio`;
    
    return {
      url: publicUrl.publicUrl,
      alt: altText,
    };
  } catch (error) {
    console.error('Photo download/upload error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check authorization if header is present
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { latitude, longitude, radius = 5000 } = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Missing required parameters: latitude, longitude');
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Fetch all cuisine types for mapping
    const { data: cuisineTypes } = await supabase
      .from('cuisine_types')
      .select('id, slug');
    
    const cuisineSlugToId = new Map<string, string>();
    if (cuisineTypes) {
      for (const ct of cuisineTypes) {
        cuisineSlugToId.set(ct.slug, ct.id);
      }
    }

    console.log(`Searching for restaurants near ${latitude}, ${longitude} within ${radius}m`);

    // Search for restaurants using Google Places API with more fields
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
    const cityCache: Map<string, string> = new Map();

    for (const place of places) {
      try {
        // Check if restaurant already exists
        const { data: existing } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', place.place_id)
          .maybeSingle();

        if (existing) {
          skipped.push(place.name);
          continue;
        }

        // Get place details with maximum fields
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,formatted_phone_number,international_phone_number,website,url,opening_hours,photos,types,address_components,reviews,editorial_summary&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          errors.push(`${place.name}: Failed to get details`);
          continue;
        }

        const details = detailsData.result as GooglePlace;

        // Extract city information
        const cityInfo = extractCityInfo(
          details.address_components, 
          details.geometry.location.lat, 
          details.geometry.location.lng
        );

        if (!cityInfo) {
          errors.push(`${place.name}: Could not extract city information`);
          continue;
        }

        // Find or create city
        let cityId: string;
        const cachedCityId = cityCache.get(cityInfo.name.toLowerCase());
        
        if (cachedCityId) {
          cityId = cachedCityId;
        } else {
          const citySlug = slugify(cityInfo.name);
          const { data: existingCity } = await supabase
            .from('cities')
            .select('id')
            .eq('slug', citySlug)
            .maybeSingle();

          if (existingCity) {
            cityId = existingCity.id;
            cityCache.set(cityInfo.name.toLowerCase(), cityId);
          } else {
            console.log(`Creating new city: ${cityInfo.name}, ${cityInfo.province}`);
            
            const { data: newCity, error: cityError } = await supabase
              .from('cities')
              .insert({
                name: cityInfo.name,
                slug: citySlug,
                province: cityInfo.province,
                latitude: cityInfo.latitude,
                longitude: cityInfo.longitude,
                description: `Ontdek de beste restaurants in ${cityInfo.name}${cityInfo.province ? `, ${cityInfo.province}` : ''}. Van gezellige eetcafés tot fine dining.`,
                meta_title: `Beste Restaurants ${cityInfo.name} | Reviews & Menu's | Happio`,
                meta_description: `Vind de ${cityInfo.name} beste restaurants. Lees reviews, bekijk menu's en reserveer direct. ✓ Actuele openingstijden ✓ Foto's ✓ Beoordelingen`,
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

        // Generate unique slug
        let baseSlug = slugify(details.name);
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const { data: slugExists } = await supabase
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
          
          if (!slugExists) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Download and upload all photos
        const uploadedPhotos: Array<{ url: string; alt: string; isPrimary: boolean }> = [];
        if (details.photos && details.photos.length > 0) {
          console.log(`Downloading ${details.photos.length} photos for ${details.name}`);
          
          const citySlug = slugify(cityInfo.name);
          for (let i = 0; i < details.photos.length; i++) {
            const photo = details.photos[i];
            const uploadResult = await downloadAndUploadPhoto(
              supabase,
              photo.photo_reference,
              googleApiKey,
              details.name,
              slug,
              cityInfo.name,
              citySlug,
              i
            );
            
            if (uploadResult) {
              uploadedPhotos.push({
                ...uploadResult,
                isPrimary: i === 0,
              });
            }
          }
        }

        // Parse opening hours
        let openingHours: Record<string, { open: string; close: string }> | null = null;
        if (details.opening_hours?.weekday_text) {
          openingHours = {};
          const dayMap: Record<string, string> = {
            'Monday': 'monday', 'Tuesday': 'tuesday', 'Wednesday': 'wednesday',
            'Thursday': 'thursday', 'Friday': 'friday', 'Saturday': 'saturday', 'Sunday': 'sunday',
            'Maandag': 'monday', 'Dinsdag': 'tuesday', 'Woensdag': 'wednesday',
            'Donderdag': 'thursday', 'Vrijdag': 'friday', 'Zaterdag': 'saturday', 'Zondag': 'sunday'
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

        // Extract postal code and street address
        const postalCode = extractPostalCode(details.address_components);
        const streetAddress = extractStreetAddress(details.address_components);
        const finalAddress = streetAddress || details.formatted_address;

        // Get description from editorial summary or generate one
        let description = details.editorial_summary?.overview || null;
        if (!description) {
          description = `${details.name} is een restaurant in ${cityInfo.name}. Bekijk onze reviews, menu en openingstijden.`;
        }

        // Map Google types to cuisines
        const matchedCuisineIds: string[] = [];
        if (details.types) {
          for (const type of details.types) {
            const cuisineSlug = GOOGLE_TYPE_TO_CUISINE[type];
            if (cuisineSlug) {
              const cuisineId = cuisineSlugToId.get(cuisineSlug);
              if (cuisineId && !matchedCuisineIds.includes(cuisineId)) {
                matchedCuisineIds.push(cuisineId);
              }
            }
          }
        }

        // Generate SEO-optimized meta
        const priceText = details.price_level ? '€'.repeat(details.price_level) : '';
        const ratingText = details.rating ? `★ ${details.rating.toFixed(1)}` : '';
        const metaParts = [ratingText, priceText].filter(Boolean).join(' · ');
        
        const metaTitle = `${details.name} ${cityInfo.name} | ${metaParts ? metaParts + ' | ' : ''}Happio`;
        const metaDescription = `${details.name} in ${cityInfo.name}${cityInfo.province ? `, ${cityInfo.province}` : ''}. ${ratingText ? `Beoordeling: ${ratingText}. ` : ''}Bekijk menu, openingstijden en reserveer online. ✓ Reviews ✓ Foto's`;

        // Insert restaurant
        const { data: restaurant, error: insertError } = await supabase
          .from('restaurants')
          .insert({
            name: details.name,
            slug,
            description,
            address: finalAddress,
            postal_code: postalCode,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            city_id: cityId,
            google_place_id: place.place_id,
            rating: details.rating || 0,
            review_count: details.user_ratings_total || 0,
            price_range: mapPriceLevel(details.price_level),
            phone: details.formatted_phone_number || details.international_phone_number || null,
            website: details.website || null,
            image_url: uploadedPhotos.length > 0 ? uploadedPhotos[0].url : null,
            opening_hours: openingHours,
            is_verified: false,
            is_claimed: false,
            meta_title: metaTitle,
            meta_description: metaDescription,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting ${details.name}:`, insertError);
          errors.push(`${details.name}: ${insertError.message}`);
          continue;
        }

        // Insert all photos with proper alt text
        if (uploadedPhotos.length > 0 && restaurant) {
          for (const photo of uploadedPhotos) {
            await supabase
              .from('restaurant_photos')
              .insert({
                restaurant_id: restaurant.id,
                url: photo.url,
                caption: photo.alt,
                is_primary: photo.isPrimary,
                is_approved: true,
              });
          }
        }

        // Link cuisines to restaurant
        if (matchedCuisineIds.length > 0 && restaurant) {
          for (const cuisineId of matchedCuisineIds) {
            await supabase
              .from('restaurant_cuisines')
              .insert({
                restaurant_id: restaurant.id,
                cuisine_id: cuisineId,
              });
          }
          console.log(`Linked ${matchedCuisineIds.length} cuisines to ${details.name}`);
        }

        // Import Google reviews
        if (details.reviews && details.reviews.length > 0 && restaurant) {
          let reviewsImported = 0;
          for (const googleReview of details.reviews) {
            // Skip reviews without text
            if (!googleReview.text || googleReview.text.trim().length === 0) continue;
            
            const { error: reviewError } = await supabase
              .from('reviews')
              .insert({
                restaurant_id: restaurant.id,
                rating: googleReview.rating,
                content: googleReview.text,
                guest_name: googleReview.author_name || 'Google Gebruiker',
                is_approved: true,
                is_verified: false,
                created_at: new Date(googleReview.time * 1000).toISOString(),
              });
            
            if (!reviewError) {
              reviewsImported++;
            }
          }
          console.log(`Imported ${reviewsImported} Google reviews for ${details.name}`);
        }

        imported.push(`${details.name} (${cityInfo.name}) - ${uploadedPhotos.length} foto's`);
        console.log(`Imported: ${details.name} in ${cityInfo.name} with ${uploadedPhotos.length} photos`);

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
