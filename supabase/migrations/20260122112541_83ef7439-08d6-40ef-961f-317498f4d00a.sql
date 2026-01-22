-- Create a function to find nearby restaurants using PostGIS-like calculation
CREATE OR REPLACE FUNCTION public.get_nearby_restaurants(
  user_lat double precision,
  user_lng double precision,
  max_distance_km double precision DEFAULT 50,
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  google_place_id text,
  name text,
  slug text,
  description text,
  address text,
  postal_code text,
  city_id uuid,
  latitude double precision,
  longitude double precision,
  phone text,
  website text,
  email text,
  price_range public.price_range,
  rating numeric,
  review_count integer,
  image_url text,
  is_verified boolean,
  is_claimed boolean,
  owner_id uuid,
  opening_hours jsonb,
  features jsonb,
  specialties text[],
  meta_title text,
  meta_description text,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.google_place_id,
    r.name,
    r.slug,
    r.description,
    r.address,
    r.postal_code,
    r.city_id,
    r.latitude,
    r.longitude,
    r.phone,
    r.website,
    r.email,
    r.price_range,
    r.rating,
    r.review_count,
    r.image_url,
    r.is_verified,
    r.is_claimed,
    r.owner_id,
    r.opening_hours,
    r.features,
    r.specialties,
    r.meta_title,
    r.meta_description,
    r.created_at,
    r.updated_at,
    -- Haversine formula for distance in km
    (6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(user_lat)) * cos(radians(r.latitude)) * 
        cos(radians(r.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(r.latitude))
      ))
    )) as distance_km
  FROM restaurants r
  WHERE r.latitude IS NOT NULL 
    AND r.longitude IS NOT NULL
    -- Quick bounding box filter first (roughly 1 degree = 111km)
    AND r.latitude BETWEEN user_lat - (max_distance_km / 111.0) AND user_lat + (max_distance_km / 111.0)
    AND r.longitude BETWEEN user_lng - (max_distance_km / (111.0 * cos(radians(user_lat)))) AND user_lng + (max_distance_km / (111.0 * cos(radians(user_lat))))
  ORDER BY distance_km ASC
  LIMIT result_limit;
$$;