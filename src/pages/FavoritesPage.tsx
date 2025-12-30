import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useToggleFavorite } from '@/hooks/useRestaurants';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: favorites, isLoading } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <Layout title="Favorieten">
        <div className="container-wide py-8">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout title="Mijn favorieten">
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container-wide">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Mijn favorieten</h1>
              <p className="text-muted-foreground">
                {favorites?.length || 0} opgeslagen restaurants
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          {favorites && favorites.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav: any) => (
                <RestaurantCard key={fav.id} restaurant={fav.restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <h2 className="mt-4 text-xl font-semibold">Geen favorieten</h2>
              <p className="mt-2 text-muted-foreground">
                Je hebt nog geen restaurants opgeslagen. Ontdek restaurants en klik op het hartje om ze op te slaan.
              </p>
              <Button asChild className="mt-6">
                <Link to="/ontdek">Ontdek restaurants</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
