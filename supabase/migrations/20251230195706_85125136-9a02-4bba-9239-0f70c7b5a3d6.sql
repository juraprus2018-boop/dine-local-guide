-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.price_range AS ENUM ('€', '€€', '€€€', '€€€€');
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');

-- Cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  province TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cuisine types table
CREATE TABLE public.cuisine_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  postal_code TEXT,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  email TEXT,
  price_range public.price_range,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opening_hours JSONB,
  features JSONB DEFAULT '[]'::jsonb,
  specialties TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, city_id)
);

-- Restaurant cuisine junction table
CREATE TABLE public.restaurant_cuisines (
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cuisine_id UUID REFERENCES public.cuisine_types(id) ON DELETE CASCADE,
  PRIMARY KEY (restaurant_id, cuisine_id)
);

-- Restaurant photos table
CREATE TABLE public.restaurant_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

-- Restaurant claims table
CREATE TABLE public.restaurant_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.claim_status DEFAULT 'pending',
  business_email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  documents_url TEXT[],
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_claims ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user owns a restaurant
CREATE OR REPLACE FUNCTION public.owns_restaurant(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants
    WHERE id = _restaurant_id
      AND owner_id = _user_id
  )
$$;

-- RLS Policies

-- Cities: Public read, admin write
CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Cuisine types: Public read, admin write
CREATE POLICY "Cuisine types are publicly readable" ON public.cuisine_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage cuisine types" ON public.cuisine_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Restaurants: Public read, owner/admin write
CREATE POLICY "Restaurants are publicly readable" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Admins can manage restaurants" ON public.restaurants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update their restaurants" ON public.restaurants FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- Restaurant cuisines: Public read
CREATE POLICY "Restaurant cuisines are publicly readable" ON public.restaurant_cuisines FOR SELECT USING (true);
CREATE POLICY "Admins can manage restaurant cuisines" ON public.restaurant_cuisines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage their restaurant cuisines" ON public.restaurant_cuisines FOR ALL TO authenticated 
  USING (public.owns_restaurant(auth.uid(), restaurant_id));

-- Restaurant photos: Public read approved, users can upload
CREATE POLICY "Approved photos are publicly readable" ON public.restaurant_photos FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can upload photos" ON public.restaurant_photos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their photos" ON public.restaurant_photos FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all photos" ON public.restaurant_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage their restaurant photos" ON public.restaurant_photos FOR ALL TO authenticated 
  USING (public.owns_restaurant(auth.uid(), restaurant_id));

-- Profiles: Public read, own write
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL TO authenticated USING (user_id = auth.uid());

-- User roles: Only admins can view/manage
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Reviews: Public read approved, authenticated write
CREATE POLICY "Approved reviews are publicly readable" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow guest reviews" ON public.reviews FOR INSERT WITH CHECK (user_id IS NULL AND guest_email IS NOT NULL);

-- Favorites: Own only
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid());

-- Restaurant claims: Own view, admin manage
CREATE POLICY "Users can view their claims" ON public.restaurant_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create claims" ON public.restaurant_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all claims" ON public.restaurant_claims FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update restaurant rating
CREATE OR REPLACE FUNCTION public.update_restaurant_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurants
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id) AND is_approved = true),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id) AND is_approved = true),
    updated_at = now()
  WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for review changes
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_restaurant_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.restaurant_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_restaurants_city ON public.restaurants(city_id);
CREATE INDEX idx_restaurants_location ON public.restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_rating ON public.restaurants(rating DESC);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_cities_slug ON public.cities(slug);

-- Insert default cuisine types
INSERT INTO public.cuisine_types (name, slug, icon) VALUES
  ('Italiaans', 'italiaans', '🍝'),
  ('Chinees', 'chinees', '🥡'),
  ('Japans', 'japans', '🍣'),
  ('Thais', 'thais', '🍜'),
  ('Indonesisch', 'indonesisch', '🍛'),
  ('Frans', 'frans', '🥐'),
  ('Grieks', 'grieks', '🥗'),
  ('Indiaas', 'indiaas', '🍛'),
  ('Mexicaans', 'mexicaans', '🌮'),
  ('Turks', 'turks', '🥙'),
  ('Amerikaans', 'amerikaans', '🍔'),
  ('Spaans', 'spaans', '🥘'),
  ('Surinaams', 'surinaams', '🍲'),
  ('Mediterraans', 'mediterraans', '🫒'),
  ('Steakhouse', 'steakhouse', '🥩'),
  ('Visrestaurant', 'visrestaurant', '🐟'),
  ('Vegetarisch', 'vegetarisch', '🥬'),
  ('Vegan', 'vegan', '🌱');

-- Insert major Dutch cities
INSERT INTO public.cities (name, slug, province, latitude, longitude) VALUES
  ('Amsterdam', 'amsterdam', 'Noord-Holland', 52.3676, 4.9041),
  ('Rotterdam', 'rotterdam', 'Zuid-Holland', 51.9244, 4.4777),
  ('Den Haag', 'den-haag', 'Zuid-Holland', 52.0705, 4.3007),
  ('Utrecht', 'utrecht', 'Utrecht', 52.0907, 5.1214),
  ('Eindhoven', 'eindhoven', 'Noord-Brabant', 51.4416, 5.4697),
  ('Groningen', 'groningen', 'Groningen', 53.2194, 6.5665),
  ('Tilburg', 'tilburg', 'Noord-Brabant', 51.5555, 5.0913),
  ('Almere', 'almere', 'Flevoland', 52.3508, 5.2647),
  ('Breda', 'breda', 'Noord-Brabant', 51.5719, 4.7683),
  ('Nijmegen', 'nijmegen', 'Gelderland', 51.8426, 5.8546),
  ('Arnhem', 'arnhem', 'Gelderland', 51.9851, 5.8987),
  ('Haarlem', 'haarlem', 'Noord-Holland', 52.3874, 4.6462),
  ('Enschede', 'enschede', 'Overijssel', 52.2215, 6.8937),
  ('Maastricht', 'maastricht', 'Limburg', 50.8514, 5.6910),
  ('Zwolle', 'zwolle', 'Overijssel', 52.5168, 6.0830),
  ('Leiden', 'leiden', 'Zuid-Holland', 52.1601, 4.4970),
  ('Dordrecht', 'dordrecht', 'Zuid-Holland', 51.8133, 4.6901),
  ('Amersfoort', 'amersfoort', 'Utrecht', 52.1561, 5.3878),
  ('Apeldoorn', 'apeldoorn', 'Gelderland', 52.2112, 5.9699),
  ('Delft', 'delft', 'Zuid-Holland', 52.0116, 4.3571);