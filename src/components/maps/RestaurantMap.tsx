import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '@/types/database';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom red marker for selected location
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom primary color marker for restaurants
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Lightweight location type for map markers
interface RestaurantLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  slug: string;
  city: { slug: string } | null;
}

interface RestaurantMapProps {
  restaurants?: Restaurant[];
  restaurantLocations?: RestaurantLocation[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to fly to selected location
function FlyToLocation({ location, zoom }: { location: { lat: number; lng: number } | null; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], Math.max(zoom, 14), { duration: 1 });
    }
  }, [location, map, zoom]);
  
  return null;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({
  restaurants = [],
  restaurantLocations = [],
  center = [52.2130, 5.2794], // Center of Netherlands
  zoom = 8,
  onLocationSelect,
  interactive = false,
  selectedLocation,
  className = 'h-[400px] w-full',
}) => {
  // Use restaurantLocations if provided, otherwise fall back to restaurants
  const markers = restaurantLocations.length > 0 
    ? restaurantLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }))
    : restaurants.map(r => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address,
        rating: r.rating,
      }));

  return (
    <div className={`${className} rounded-lg overflow-hidden`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {interactive && <MapClickHandler onLocationSelect={onLocationSelect} />}
        
        {selectedLocation && (
          <>
            <FlyToLocation location={selectedLocation} zoom={zoom} />
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">Geselecteerde locatie</p>
                  <p className="text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-semibold text-sm">{marker.name}</h3>
                  {'address' in marker && (marker as { address?: string }).address && (
                    <p className="text-xs text-gray-600">{(marker as { address?: string }).address}</p>
                  )}
                  {'rating' in marker && (marker as { rating?: number }).rating && (
                    <p className="text-xs text-amber-600 mt-1">★ {Number((marker as { rating?: number }).rating).toFixed(1)}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
