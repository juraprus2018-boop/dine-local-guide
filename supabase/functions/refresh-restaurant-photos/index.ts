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
          .maybeSingle();

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
    const { action, jobId, batchSize = 5 } = body;

    // Handle different actions
    if (action === 'status') {
      // Get current job status
      const { data: job } = await supabase
        .from('photo_refresh_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({ job }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'pause') {
      // Pause current job
      await supabase
        .from('photo_refresh_jobs')
        .update({ status: 'paused' })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({ success: true, message: 'Job paused' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'start' || action === 'resume') {
      // Get total count of restaurants with google_place_id
      const { count: totalCount } = await supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .not('google_place_id', 'is', null);

      let job;

      if (action === 'resume' && jobId) {
        // Resume existing job
        const { data: existingJob } = await supabase
          .from('photo_refresh_jobs')
          .select('*')
          .eq('id', jobId)
          .maybeSingle();

        if (existingJob) {
          await supabase
            .from('photo_refresh_jobs')
            .update({ status: 'running' })
            .eq('id', jobId);
          job = { ...existingJob, status: 'running' };
        }
      }

      if (!job) {
        // Create new job
        const { data: newJob, error: createError } = await supabase
          .from('photo_refresh_jobs')
          .insert({
            status: 'running',
            total_restaurants: totalCount || 0,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        job = newJob;
      }

      // Start processing in background
      (globalThis as any).EdgeRuntime?.waitUntil?.(processPhotos(supabase, googleApiKey, job.id, batchSize)) 
        || processPhotos(supabase, googleApiKey, job.id, batchSize);

      return new Response(
        JSON.stringify({ success: true, job }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

async function processPhotos(supabase: any, googleApiKey: string, jobId: string, batchSize: number) {
  const MAX_TIME_MS = 55000; // 55 seconds max to stay within limits
  const startTime = Date.now();

  try {
    // Get current job
    const { data: job } = await supabase
      .from('photo_refresh_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      console.error('Job not found:', jobId);
      return;
    }

    // Get already completed restaurant IDs
    const completedIds = (job.completed_restaurants || []).map((r: any) => r.id);

    // Get restaurants that haven't been processed yet
    let query = supabase
      .from('restaurants')
      .select('id, name, slug, google_place_id, city:cities(name, slug)')
      .not('google_place_id', 'is', null)
      .order('name', { ascending: true })
      .limit(batchSize);

    if (completedIds.length > 0) {
      // Filter out already completed restaurants
      query = query.not('id', 'in', `(${completedIds.join(',')})`);
    }

    const { data: restaurants, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching restaurants:', fetchError);
      await supabase
        .from('photo_refresh_jobs')
        .update({ 
          status: 'failed',
          errors: [...(job.errors || []), fetchError.message]
        })
        .eq('id', jobId);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      // All done!
      await supabase
        .from('photo_refresh_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      console.log('Photo refresh completed!');
      return;
    }

    console.log(`Processing ${restaurants.length} restaurants`);

    const newCompleted: any[] = [];
    let photosDownloaded = 0;
    const errors: string[] = [];

    for (const restaurant of restaurants) {
      // Check if we should stop (time limit or paused)
      if (Date.now() - startTime > MAX_TIME_MS) {
        console.log('Time limit reached, will continue in next batch');
        break;
      }

      // Check if job was paused
      const { data: currentJob } = await supabase
        .from('photo_refresh_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (currentJob?.status === 'paused') {
        console.log('Job paused by user');
        return;
      }

      try {
        const cityData = restaurant.city as { name: string; slug: string } | { name: string; slug: string }[] | null;
        const city = Array.isArray(cityData) ? cityData[0] : cityData;
        
        if (!city) {
          errors.push(`${restaurant.name}: Geen stad gekoppeld`);
          continue;
        }

        console.log(`Processing: ${restaurant.name} (${restaurant.google_place_id})`);

        // Update current restaurant being processed
        await supabase
          .from('photo_refresh_jobs')
          .update({ 
            last_restaurant_id: restaurant.id,
            last_restaurant_name: restaurant.name
          })
          .eq('id', jobId);

        // Get place details from Google
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant.google_place_id}&fields=photos&key=${googleApiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK') {
          errors.push(`${restaurant.name}: Google API error - ${detailsData.status}`);
          continue;
        }

        const photos = detailsData.result?.photos || [];
        
        if (photos.length === 0) {
          console.log(`No photos found for ${restaurant.name}`);
          newCompleted.push({
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            city: city.name,
            citySlug: city.slug,
            photosCount: 0,
            url: `/${city.slug}/${restaurant.slug}`
          });
          continue;
        }

        console.log(`Found ${photos.length} photos for ${restaurant.name}`);

        // Delete existing photos for this restaurant from database
        await supabase
          .from('restaurant_photos')
          .delete()
          .eq('restaurant_id', restaurant.id);

        // Download and upload all photos (max 10)
        const uploadedPhotos: Array<{ url: string; isPrimary: boolean }> = [];
        const maxPhotos = Math.min(photos.length, 10);
        
        for (let i = 0; i < maxPhotos; i++) {
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
            photosDownloaded++;
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

        newCompleted.push({
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          city: city.name,
          citySlug: city.slug,
          photosCount: uploadedPhotos.length,
          url: `/${city.slug}/${restaurant.slug}`
        });

        console.log(`Completed: ${restaurant.name} - ${uploadedPhotos.length} photos`);

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${restaurant.name}: ${errMsg}`);
        console.error(`Error processing ${restaurant.name}:`, error);
      }
    }

    // Update job progress
    const allCompleted = [...(job.completed_restaurants || []), ...newCompleted];
    
    await supabase
      .from('photo_refresh_jobs')
      .update({ 
        processed_restaurants: allCompleted.length,
        photos_downloaded: (job.photos_downloaded || 0) + photosDownloaded,
        completed_restaurants: allCompleted,
        errors: [...(job.errors || []), ...errors]
      })
      .eq('id', jobId);

    // Check if there are more restaurants to process
    const { count: remainingCount } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .not('google_place_id', 'is', null)
      .not('id', 'in', `(${allCompleted.map((r: any) => r.id).join(',')})`);

    if (remainingCount && remainingCount > 0) {
      // Schedule next batch
      console.log(`${remainingCount} restaurants remaining, scheduling next batch...`);
      
      // Small delay before next batch
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Continue processing
      await processPhotos(supabase, googleApiKey, jobId, batchSize);
    } else {
      // All done!
      await supabase
        .from('photo_refresh_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      console.log('Photo refresh completed!');
    }

  } catch (error) {
    console.error('Error in processPhotos:', error);
    await supabase
      .from('photo_refresh_jobs')
      .update({ 
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
      .eq('id', jobId);
  }
}
