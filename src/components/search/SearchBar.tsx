import { useState, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearch, useCities } from '@/hooks/useRestaurants';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'default' | 'hero';
  className?: string;
}

export function SearchBar({ variant = 'default', className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [open, setOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const navigate = useNavigate();

  const { data: searchResults } = useSearch(query);
  const { data: cities } = useCities();

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (location) {
      navigate(`/${location}${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    } else if (query) {
      navigate(`/zoeken?q=${encodeURIComponent(query)}`);
    }
  }, [query, location, navigate]);

  const handleSelectResult = (type: string, slug: string, citySlug?: string) => {
    setOpen(false);
    if (type === 'restaurant' && citySlug) {
      navigate(`/${citySlug}/${slug}`);
    } else if (type === 'city') {
      navigate(`/${slug}`);
    } else if (type === 'cuisine') {
      navigate(`/keukens/${slug}`);
    }
  };

  const handleSelectCity = (citySlug: string) => {
    setLocation(citySlug);
    setLocationOpen(false);
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'flex flex-col gap-2 sm:flex-row',
        isHero && 'bg-card rounded-2xl p-2 shadow-xl border',
        className
      )}
    >
      {/* Search Input */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length >= 2) setOpen(true);
              }}
              placeholder="Restaurant, keuken of gerecht..."
              className={cn(
                'pl-10 pr-4',
                isHero && 'h-12 border-0 bg-transparent text-base focus-visible:ring-0'
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
              {searchResults?.restaurants && searchResults.restaurants.length > 0 && (
                <CommandGroup heading="Restaurants">
                  {searchResults.restaurants.map((r: any) => (
                    <CommandItem
                      key={r.id}
                      onSelect={() => handleSelectResult('restaurant', r.slug, r.city?.slug)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.city?.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults?.cities && searchResults.cities.length > 0 && (
                <CommandGroup heading="Steden">
                  {searchResults.cities.map((c: any) => (
                    <CommandItem
                      key={c.id}
                      onSelect={() => handleSelectResult('city', c.slug)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {c.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults?.cuisines && searchResults.cuisines.length > 0 && (
                <CommandGroup heading="Keukens">
                  {searchResults.cuisines.map((c: any) => (
                    <CommandItem
                      key={c.id}
                      onSelect={() => handleSelectResult('cuisine', c.slug)}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">{c.icon}</span>
                      {c.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Location Input */}
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1 sm:max-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location ? cities?.find(c => c.slug === location)?.name || location : ''}
              onChange={(e) => {
                setLocation(e.target.value);
                setLocationOpen(true);
              }}
              placeholder="Locatie"
              className={cn(
                'pl-10 pr-4',
                isHero && 'h-12 border-0 border-l bg-transparent text-base focus-visible:ring-0 rounded-l-none'
              )}
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Geen steden gevonden.</CommandEmpty>
              <CommandGroup heading="Populaire steden">
                {cities?.slice(0, 10).map((city) => (
                  <CommandItem
                    key={city.id}
                    onSelect={() => handleSelectCity(city.slug)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {city.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Search Button */}
      <Button
        type="submit"
        size={isHero ? 'lg' : 'default'}
        className={cn(isHero && 'h-12 px-8')}
      >
        <Search className="mr-2 h-4 w-4" />
        Zoeken
      </Button>
    </form>
  );
}
