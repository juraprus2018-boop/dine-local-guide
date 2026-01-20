import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Heart, User, LogOut, Settings, MapPin, Search, MessageSquare, Camera } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import mijnRestaurantLogo from '@/assets/mijn-restaurant-logo.png';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch pending reviews count for admins
  const { data: pendingReviewsCount } = useQuery({
    queryKey: ['pendingReviewsCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && isAdmin(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={mijnRestaurantLogo} alt="Mijn Restaurant" className="h-14" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/in-de-buurt" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                In de buurt
              </span>
            </Link>
            <Link 
              to="/provincies" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Provincies
            </Link>
            <Link 
              to="/keukens" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Keukens
            </Link>
            <Link 
              to="/ontdek" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ontdek
            </Link>
            <Link 
              to="/foodwall" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                Foodwall
              </span>
            </Link>
            <Link 
              to="/reviews" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Reviews
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
              <Link to="/zoeken">
                <Search className="h-5 w-5" />
                <span className="sr-only">Zoeken</span>
              </Link>
            </Button>

            {user ? (
              <>
                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                  <Link to="/favorieten">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Favorieten</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.display_name || 'Gebruiker'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profiel" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mijn profiel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorieten" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        Favorieten
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/reviews" className="cursor-pointer flex items-center justify-between">
                            <span className="flex items-center">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Reviews
                            </span>
                            {pendingReviewsCount && pendingReviewsCount > 0 && (
                              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                                {pendingReviewsCount}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Uitloggen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/auth">Inloggen</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth?mode=signup">Registreren</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'
          )}
        >
          <nav className="flex flex-col gap-2">
            <Link
              to="/zoeken"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="h-4 w-4" />
              Zoeken
            </Link>
            <Link
              to="/in-de-buurt"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MapPin className="h-4 w-4" />
              In de buurt
            </Link>
            <Link
              to="/ontdek"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ontdek
            </Link>
            <Link
              to="/keukens"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Keukens
            </Link>
            <Link
              to="/foodwall"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Camera className="h-4 w-4" />
              Foodwall
            </Link>
            <Link
              to="/reviews"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reviews
            </Link>
            {user && (
              <Link
                to="/favorieten"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Favorieten
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
