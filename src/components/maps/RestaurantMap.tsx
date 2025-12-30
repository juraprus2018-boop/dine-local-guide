import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface RestaurantMapProps {
  restaurants?: Restaurant[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({
  restaurants = [],
  center = [5.4697, 52.1326], // Center of Netherlands
  zoom = 7,
  onLocationSelect,
  interactive = false,
  selectedLocation,
  className = 'h-[400px] w-full',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const selectedMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Check for saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  const handleSetToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center,
        zoom: zoom,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      if (interactive && onLocationSelect) {
        map.current.on('click', (e) => {
          onLocationSelect(e.lngLat.lat, e.lngLat.lng);
        });
      }

      map.current.on('load', () => {
        setIsMapReady(true);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      localStorage.removeItem('mapbox_token');
      setMapboxToken('');
    }

    return () => {
      markers.current.forEach(marker => marker.remove());
      selectedMarker.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update center and zoom
  useEffect(() => {
    if (map.current && isMapReady) {
      map.current.flyTo({ center, zoom, duration: 1000 });
    }
  }, [center, zoom, isMapReady]);

  // Add restaurant markers
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    restaurants.forEach((restaurant) => {
      const el = document.createElement('div');
      el.className = 'restaurant-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${restaurant.name}</h3>
          <p class="text-xs text-gray-600">${restaurant.address}</p>
          ${restaurant.rating ? `<p class="text-xs text-amber-600">★ ${restaurant.rating.toFixed(1)}</p>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [restaurants, isMapReady]);

  // Handle selected location marker
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    selectedMarker.current?.remove();

    if (selectedLocation) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="w-10 h-10 bg-destructive rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <svg class="w-5 h-5 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </div>
      `;

      selectedMarker.current = new mapboxgl.Marker(el)
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedLocation, isMapReady]);

  if (!mapboxToken) {
    return (
      <div className={`${className} bg-muted rounded-lg flex flex-col items-center justify-center p-6`}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Mapbox Token Vereist</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Voer je Mapbox public token in om de kaart te kunnen gebruiken.
          <br />
          <a 
            href="https://mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Verkrijg een gratis token op mapbox.com
          </a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSetToken}>Opslaan</Button>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className={`${className} rounded-lg overflow-hidden`} />;
};

export default RestaurantMap;
