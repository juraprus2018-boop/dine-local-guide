import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Upload, MapPin, X, Loader2, Camera, Plus } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface FoodPost {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  restaurant_id: string | null;
  image_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    city?: { slug: string } | null;
  } | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  is_liked?: boolean;
}

export default function FoodwallPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch food posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['food-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_posts')
        .select(`
          *,
          restaurant:restaurants(id, name, slug, city:cities(slug))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Check which posts the current user has liked
      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('food_post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      }

      return (data || []).map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
        is_liked: likedPostIds.has(post.id)
      })) as FoodPost[];
    },
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Je moet ingelogd zijn');

      if (isLiked) {
        const { error } = await supabase
          .from('food_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('food_post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-posts'] });
    },
  });

  const handleLike = (postId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('Log in om posts te liken');
      return;
    }
    likeMutation.mutate({ postId, isLiked });
  };

  return (
    <Layout
      title="Foodwall"
      description="Ontdek heerlijke gerechten gedeeld door de Happio community. Deel je eigen food foto's en ontdek nieuwe restaurants."
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container-wide">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                🍽️ Foodwall
              </h1>
            <p className="mt-2 text-muted-foreground">
              Deel je favoriete gerechten en ontdek wat anderen eten
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Post delen
              </Button>
            </DialogTrigger>
            <CreatePostDialog 
              onSuccess={() => {
                setCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['food-posts'] });
              }} 
            />
          </Dialog>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-8 md:py-12">
        <div className="container-wide">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square skeleton rounded-lg" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <FoodPostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Camera className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Nog geen posts
              </h3>
              <p className="text-muted-foreground mb-6">
                Wees de eerste die een food foto deelt!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Plaats je foodwall bericht
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function FoodPostCard({ post, onLike }: { post: FoodPost; onLike: (postId: string, isLiked: boolean) => void }) {
  const restaurantUrl = post.restaurant?.city?.slug && post.restaurant?.slug
    ? `/${post.restaurant.city.slug}/${post.restaurant.slug}`
    : null;

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square">
        <img
          src={post.image_url}
          alt={post.caption || 'Food post'}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <CardContent className="p-4">
        {/* User info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {(post.profile?.display_name?.[0] || post.guest_name?.[0] || 'G').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {post.profile?.display_name || post.guest_name || 'Gast'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: nl })}
            </p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-3 line-clamp-2">{post.caption}</p>
        )}

        {/* Restaurant tag */}
        {post.restaurant && restaurantUrl && (
          <Link 
            to={restaurantUrl}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
          >
            <MapPin className="h-3 w-3" />
            {post.restaurant.name}
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <button
            onClick={() => onLike(post.id, post.is_liked || false)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className={cn('h-5 w-5', post.is_liked && 'fill-primary text-primary')} />
            <span>{post.likes_count}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePostDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantPopoverOpen, setRestaurantPopoverOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Search restaurants
  const { data: restaurants } = useQuery({
    queryKey: ['restaurant-search', restaurantSearch],
    queryFn: async () => {
      if (!restaurantSearch || restaurantSearch.length < 2) return [];
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .ilike('name', `%${restaurantSearch}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: restaurantSearch.length >= 2,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Bestand is te groot (max 10MB)');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Alleen afbeeldingen zijn toegestaan');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    // Require guest name and email if not logged in
    if (!user && !guestName.trim()) {
      toast.error('Vul je naam in');
      return;
    }
    if (!user && !guestEmail.trim()) {
      toast.error('Vul je email in');
      return;
    }

    setIsUploading(true);
    try {
      // Upload image
      const fileExt = selectedFile.name.split('.').pop();
      const uniqueId = user?.id || 'guest';
      const fileName = `foodwall/${uniqueId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-photos')
        .getPublicUrl(fileName);

      // Create post
      const { error: postError } = await supabase
        .from('food_posts')
        .insert({
          user_id: user?.id || null,
          guest_name: user ? null : guestName.trim(),
          guest_email: user ? null : guestEmail.trim(),
          image_url: publicUrl,
          caption: caption || null,
          restaurant_id: selectedRestaurant?.id || null,
        });

      if (postError) throw postError;

      toast.success('Post gedeeld! 🎉');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Er ging iets mis');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Deel je food moment</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 pb-4">
        {/* Photo upload */}
        {!preview ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Klik om een foto te selecteren</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG of WebP, max 10MB</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Guest name (only for non-logged in users) */}
        {!user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guestName">Je naam *</Label>
              <Input
                id="guestName"
                placeholder="Hoe mogen we je noemen?"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Je email *</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="je@email.nl"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Beschrijving</Label>
          <Textarea
            id="caption"
            placeholder="Wat heb je gegeten? 🍕"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Restaurant tag */}
        <div className="space-y-2">
          <Label>Restaurant taggen (optioneel)</Label>
          <Popover open={restaurantPopoverOpen} onOpenChange={setRestaurantPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-start"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {selectedRestaurant ? selectedRestaurant.name : 'Zoek restaurant...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Zoek restaurant..." 
                  value={restaurantSearch}
                  onValueChange={setRestaurantSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {restaurantSearch.length < 2 
                      ? 'Typ minimaal 2 karakters...'
                      : 'Geen restaurants gevonden'
                    }
                  </CommandEmpty>
                  <CommandGroup>
                    {restaurants?.map((restaurant) => (
                      <CommandItem
                        key={restaurant.id}
                        value={restaurant.id}
                        onSelect={() => {
                          setSelectedRestaurant(restaurant);
                          setRestaurantPopoverOpen(false);
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {restaurant.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedRestaurant && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRestaurant(null)}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Tag verwijderen
            </Button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploaden...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Delen
            </>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}
