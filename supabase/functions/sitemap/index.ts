import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const BASE_URL = "https://happio.nl";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all cities
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("slug, updated_at")
      .order("name");

    if (citiesError) throw citiesError;

    // Fetch all restaurants with their city slug
    const { data: restaurants, error: restaurantsError } = await supabase
      .from("restaurants")
      .select(`
        slug,
        updated_at,
        city:cities(slug)
      `)
      .order("name");

    if (restaurantsError) throw restaurantsError;

    // Fetch all cuisines
    const { data: cuisines, error: cuisinesError } = await supabase
      .from("cuisine_types")
      .select("slug")
      .order("name");

    if (cuisinesError) throw cuisinesError;

    const today = new Date().toISOString().split("T")[0];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Static pages -->
  <url>
    <loc>${BASE_URL}/ontdek</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/keukens</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/provincies</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/in-de-buurt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/foodwall</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Add cuisine pages
    for (const cuisine of cuisines || []) {
      sitemap += `
  <url>
    <loc>${BASE_URL}/keukens/${cuisine.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add city pages
    for (const city of cities || []) {
      const lastmod = city.updated_at ? city.updated_at.split("T")[0] : today;
      sitemap += `
  <url>
    <loc>${BASE_URL}/${city.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Add restaurant pages
    for (const restaurant of restaurants || []) {
      const citySlug = (restaurant.city as any)?.slug;
      if (!citySlug) continue;
      
      const lastmod = restaurant.updated_at ? restaurant.updated_at.split("T")[0] : today;
      sitemap += `
  <url>
    <loc>${BASE_URL}/${citySlug}/${restaurant.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  }
});
