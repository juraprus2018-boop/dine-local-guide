import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eoxcxesrejwbczhyjjsf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveGN4ZXNyZWp3YmN6aHlqanNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjA3NDAsImV4cCI6MjA4MjY5Njc0MH0.SSzdDHB3G0vrMZ2SMUTx6YpeqASW3gBEcYb78dvE9MI';

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://happio.nl';

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');

  try {
    // Fetch all data in parallel
    const [citiesResult, restaurantsResult, cuisinesResult] = await Promise.all([
      supabase.from('cities').select('slug, updated_at'),
      supabase.from('restaurants').select('slug, updated_at'),
      supabase.from('cuisine_types').select('slug'),
    ]);

    const cities = citiesResult.data || [];
    const restaurants = restaurantsResult.data || [];
    const cuisines = cuisinesResult.data || [];

    const today = new Date().toISOString().split('T')[0];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Static pages -->
  <url>
    <loc>${BASE_URL}/ontdek</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
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
    <priority>0.7</priority>
  </url>

  <!-- Cuisine pages -->
${cuisines.map(c => `  <url>
    <loc>${BASE_URL}/keukens/${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

  <!-- City pages -->
${cities.map(c => `  <url>
    <loc>${BASE_URL}/stad/${c.slug}</loc>
    <lastmod>${c.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Restaurant pages -->
${restaurants.map(r => `  <url>
    <loc>${BASE_URL}/restaurant/${r.slug}</loc>
    <lastmod>${r.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

    writeFileSync('public/sitemap.xml', sitemap);
    console.log(`✅ Sitemap generated with ${cities.length} cities, ${restaurants.length} restaurants, ${cuisines.length} cuisines`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
