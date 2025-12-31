import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Google Places types to our cuisine slugs
const cuisineTypeMapping: Record<string, string> = {
  italian_restaurant: "italiaans",
  pizza_restaurant: "italiaans",
  chinese_restaurant: "chinees",
  japanese_restaurant: "japans",
  sushi_restaurant: "japans",
  ramen_restaurant: "japans",
  thai_restaurant: "thais",
  indian_restaurant: "indiaas",
  mexican_restaurant: "mexicaans",
  french_restaurant: "frans",
  greek_restaurant: "grieks",
  spanish_restaurant: "spaans",
  turkish_restaurant: "turks",
  american_restaurant: "amerikaans",
  hamburger_restaurant: "amerikaans",
  steak_house: "steakhouse",
  seafood_restaurant: "visrestaurant",
  vegetarian_restaurant: "vegetarisch",
  vegan_restaurant: "vegan",
  mediterranean_restaurant: "mediterraans",
  indonesian_restaurant: "indonesisch",
  surinamese_restaurant: "surinaams",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all restaurants with google_place_id
    const { data: restaurants, error: fetchError } = await supabase
      .from("restaurants")
      .select("id, google_place_id, name")
      .not("google_place_id", "is", null);

    if (fetchError) {
      throw new Error(`Error fetching restaurants: ${fetchError.message}`);
    }

    // Fetch cuisine types from database
    const { data: cuisineTypes } = await supabase
      .from("cuisine_types")
      .select("id, slug");
    
    const cuisineMap = new Map(cuisineTypes?.map((c: { id: string; slug: string }) => [c.slug, c.id]) || []);

    let totalLinked = 0;
    let processed = 0;
    const details: string[] = [];

    for (const restaurant of restaurants || []) {
      try {
        // Get place details from Google Places API
        const detailsUrl = `https://places.googleapis.com/v1/places/${restaurant.google_place_id}`;
        
        const response = await fetch(detailsUrl, {
          headers: {
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask": "types",
          },
        });

        if (response.ok) {
          const placeData = await response.json();
          const placeTypes = placeData.types || [];
          
          // Find matching cuisines
          const linkedCuisines: string[] = [];
          for (const placeType of placeTypes) {
            const cuisineSlug = cuisineTypeMapping[placeType];
            if (cuisineSlug && !linkedCuisines.includes(cuisineSlug)) {
              const cuisineId = cuisineMap.get(cuisineSlug);
              if (cuisineId) {
                // Check if link already exists
                const { data: existing } = await supabase
                  .from("restaurant_cuisines")
                  .select("restaurant_id")
                  .eq("restaurant_id", restaurant.id)
                  .eq("cuisine_id", cuisineId)
                  .maybeSingle();

                if (!existing) {
                  const { error: insertError } = await supabase
                    .from("restaurant_cuisines")
                    .insert({ restaurant_id: restaurant.id, cuisine_id: cuisineId });
                  
                  if (!insertError) {
                    totalLinked++;
                    linkedCuisines.push(cuisineSlug);
                  }
                }
              }
            }
          }
          
          if (linkedCuisines.length > 0) {
            details.push(`${restaurant.name}: ${linkedCuisines.join(", ")}`);
          }
        }
        processed++;
      } catch (error) {
        console.error(`Error processing restaurant ${restaurant.name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        cuisinesLinked: totalLinked,
        details,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Link cuisines error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
