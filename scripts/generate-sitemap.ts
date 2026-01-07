import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://eoxcxesrejwbczhyjjsf.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveGN4ZXNyZWp3YmN6aHlqanNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjA3NDAsImV4cCI6MjA4MjY5Njc0MH0.SSzdDHB3G0vrMZ2SMUTx6YpeqASW3gBEcYb78dvE9MI";

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = "https://www.eatspot.nl";
const SITEMAPS_DIR = "dist/sitemaps";

function isoDate(dateLike?: string | null) {
  if (!dateLike) return new Date().toISOString().split("T")[0];
  return dateLike.split("T")[0];
}

function buildUrlset(
  urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }>
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map(
      (u) => `
  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `
    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `
    <priority>${u.priority}</priority>` : ""}
  </url>`
    )
    .join("")}
</urlset>`;
}

async function generateSitemap() {
  console.log("🗺️  Generating sitemap index + per-city sitemaps...");

  try {
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("id, slug, updated_at")
      .order("name")
      .range(0, 9999);

    if (citiesError) throw citiesError;

    // Fetch restaurants in batches (PostgREST caps responses at 1000 rows)
    const restaurants: Array<{ slug: string; updated_at: string | null; city_id: string }> = [];
    const batchSize = 1000;
    let from = 0;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("restaurants")
        .select("slug, updated_at, city_id")
        .not("city_id", "is", null)
        .order("name")
        .range(from, to);

      if (error) throw error;

      const batch = (data || []) as Array<{ slug: string; updated_at: string | null; city_id: string }>;
      restaurants.push(...batch);

      if (batch.length < batchSize) break;
      from += batchSize;
    }


    const citiesList = cities || [];

    mkdirSync(SITEMAPS_DIR, { recursive: true });

    // Group restaurants by city_id
    const restaurantsByCityId = new Map<
      string,
      Array<{ slug: string; updated_at: string | null; city_id: string }>
    >();

    for (const r of restaurants as any[]) {
      if (!r.city_id) continue;
      const list = restaurantsByCityId.get(r.city_id) || [];
      list.push(r);
      restaurantsByCityId.set(r.city_id, list);
    }

    // Write per-city sitemaps + build sitemap index
    const sitemapIndexEntries: Array<{ loc: string; lastmod: string }> = [];

    for (const city of citiesList as any[]) {
      const cityRestaurants = restaurantsByCityId.get(city.id) || [];
      const fileName = `sitemap-${city.slug}.xml`;
      const outPath = path.join(SITEMAPS_DIR, fileName);

      const urls = [
        {
          loc: `${BASE_URL}/${city.slug}`,
          lastmod: isoDate(city.updated_at),
          changefreq: "weekly",
          priority: "0.8",
        },
        ...cityRestaurants.map((r) => ({
          loc: `${BASE_URL}/${city.slug}/${r.slug}`,
          lastmod: isoDate(r.updated_at),
          changefreq: "weekly",
          priority: "0.6",
        })),
      ];

      writeFileSync(outPath, buildUrlset(urls));

      sitemapIndexEntries.push({
        loc: `${BASE_URL}/sitemaps/${fileName}`,
        lastmod: isoDate(city.updated_at),
      });
    }

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapIndexEntries
      .map(
        (s) => `
  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
      )
      .join("")}
</sitemapindex>`;

    writeFileSync("dist/sitemap.xml", sitemapIndex);

    console.log(
      `✅ Generated sitemap.xml (index) + ${sitemapIndexEntries.length} city sitemaps in /dist/sitemaps/`
    );
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();

