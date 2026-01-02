import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
    
    const baseName = `${restaurantSlug}-${citySlug}-happio`;
    const fileName = photoIndex === 0 
      ? `${baseName}.jpg`
      : `${baseName}-${photoIndex + 1}.jpg`;
    
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

    // Check admin authorization
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

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    const body = await req.json().catch(() => ({}));
    const { restaurantId, batchSize = 10, offset = 0 } = body;

    // If specific restaurant ID provided, only process that one
    let restaurantsQuery = supabase
      .from('restaurants')
      .select('id, name, slug, google_place_id, city:cities(name, slug)')
      .not('google_place_id', 'is', null);

    if (restaurantId) {
      restaurantsQuery = restaurantsQuery.eq('id', restaurantId);
    } else {
      restaurantsQuery = restaurantsQuery.range(offset, offset + batchSize - 1);
    }

    const { data: restaurants, error: fetchError } = await restaurantsQuery;

    if (fetchError) {
      throw new Error(`Failed to fetch restaurants: ${fetchError.message}`);
    }

    if (!restaurants || restaurants.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more restaurants to process',
          processed: 0,
          hasMore: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${restaurants.length} restaurants (offset: ${offset})`);

    const results = {
      processed: 0,
      photosDownloaded: 0,
      errors: [] as string[],
    };

    for (const restaurant of restaurants) {
      try {
        const cityData = restaurant.city as { name: string; slug: string } | { name: string; slug: string }[] | null;
        const city = Array.isArray(cityData) ? cityData[0] : cityData;
        if (!city) {
          results.errors.push(`${restaurant.name}: No city linked`);
          continue;
        }

        console.log(`Processing: ${restaurant.name} (${restaurant.google_place_id})`);

        // Get place details from Google
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant.google_place_id}&fields=photos&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          results.errors.push(`${restaurant.name}: Google API error - ${detailsData.status}`);
          continue;
        }

        const photos = detailsData.result?.photos || [];
        
        if (photos.length === 0) {
          console.log(`No photos found for ${restaurant.name}`);
          results.processed++;
          continue;
        }

        console.log(`Found ${photos.length} photos for ${restaurant.name}`);

        // Delete existing photos for this restaurant from database
        await supabase
          .from('restaurant_photos')
          .delete()
          .eq('restaurant_id', restaurant.id);

        // Download and upload all photos
        const uploadedPhotos: Array<{ url: string; isPrimary: boolean }> = [];
        
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const uploadResult = await downloadAndUploadPhoto(
            supabase,
            photo.photo_reference,
            googleApiKey,
            restaurant.name,
            restaurant.slug,
            city.name,
            city.slug,
            i
          );
          
          if (uploadResult) {
            uploadedPhotos.push({
              url: uploadResult.url,
              isPrimary: i === 0,
            });
            results.photosDownloaded++;
          }
        }

        // Update restaurant with primary photo
        if (uploadedPhotos.length > 0) {
          const primaryPhoto = uploadedPhotos.find(p => p.isPrimary);
          if (primaryPhoto) {
            await supabase
              .from('restaurants')
              .update({ image_url: primaryPhoto.url })
              .eq('id', restaurant.id);
          }

          // Insert photo records
          const photoRecords = uploadedPhotos.map((photo, index) => ({
            restaurant_id: restaurant.id,
            url: photo.url,
            is_primary: photo.isPrimary,
            is_approved: true,
            caption: index === 0 ? `${restaurant.name} - ${city.name}` : null,
          }));

          await supabase
            .from('restaurant_photos')
            .insert(photoRecords);
        }

        results.processed++;
        console.log(`Completed: ${restaurant.name} - ${uploadedPhotos.length} photos`);

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${restaurant.name}: ${errMsg}`);
        console.error(`Error processing ${restaurant.name}:`, error);
      }
    }

    // Check if there are more restaurants
    const { count } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .not('google_place_id', 'is', null);

    const hasMore = !restaurantId && (offset + batchSize) < (count || 0);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        hasMore,
        nextOffset: hasMore ? offset + batchSize : null,
        totalRestaurants: count,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refresh-restaurant-photos:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
