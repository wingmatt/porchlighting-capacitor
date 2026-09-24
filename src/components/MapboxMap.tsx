import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationCoordinates } from '../types';
import { MapPin } from 'lucide-preact';

interface MapboxMapProps {
  location?: string | LocationCoordinates | [number, number] | null;
  name?: string;
  statusMessage?: string;
  isOn?: boolean;
  color?: string;
  zoom?: number;
  interactive?: boolean;
  className?: string;
}

/**
 * Normalizes various location formats into [longitude, latitude] for Mapbox GL.
 */
export function extractLngLat(
  location?: string | LocationCoordinates | [number, number] | null
): [number, number] | null {
  if (!location) return null;

  // Array format [lng, lat]
  if (Array.isArray(location) && location.length >= 2) {
    const lng = Number(location[0]);
    const lat = Number(location[1]);
    if (!isNaN(lng) && !isNaN(lat)) {
      return [lng, lat];
    }
  }

  // Object format
  if (typeof location === 'object' && !Array.isArray(location)) {
    const locObj = location as LocationCoordinates;
    // GeoJSON coordinates [lng, lat]
    if (Array.isArray(locObj.coordinates) && locObj.coordinates.length >= 2) {
      const lng = Number(locObj.coordinates[0]);
      const lat = Number(locObj.coordinates[1]);
      if (!isNaN(lng) && !isNaN(lat)) {
        return [lng, lat];
      }
    }

    const lat = locObj.latitude ?? locObj.lat;
    const lng = locObj.longitude ?? locObj.lng ?? locObj.lon;

    if (lat !== undefined && lng !== undefined) {
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (!isNaN(numLat) && !isNaN(numLng)) {
        return [numLng, numLat]; // Mapbox uses [longitude, latitude]
      }
    }
  }

  // String format "lat, lng" or "lat,lng"
  if (typeof location === 'string') {
    const parts = location.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[1], parts[0]]; // [lng, lat]
    }
  }

  return null;
}

export const MapboxMap: FunctionComponent<MapboxMapProps> = ({
  location,
  name = 'Porchlight',
  statusMessage,
  isOn = true,
  color = '#F59E0B',
  zoom = 14,
  interactive = true,
  className = 'w-full h-64 rounded-xl overflow-hidden shadow-md',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const coords = extractLngLat(location);

  useEffect(() => {
    if (!mapContainerRef.current || !coords) return;

    // Set Mapbox token from environment or fallback
    const token =
      (import.meta as any).env?.VITE_MAPBOX_TOKEN ||
      (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN ||
      'pk.eyJ1IjoicG9yY2hsaWdodCIsImEiOiJjbHN0ZXN0dG9rZW4wMDAwMDExIn0.example';
    mapboxgl.accessToken = token;

    try {
      if (!mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: coords,
          zoom: zoom,
          interactive: interactive,
        });

        // Add standard navigation controls if interactive
        if (interactive) {
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        }

        // Custom marker element
        const el = document.createElement('div');
        el.className = 'porchlight-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = isOn ? color : '#94A3B8';
        el.style.border = '3px solid #FFFFFF';
        el.style.boxShadow = isOn
          ? `0 0 12px ${color}, 0 2px 4px rgba(0,0,0,0.3)`
          : '0 2px 4px rgba(0,0,0,0.2)';
        el.style.cursor = 'pointer';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="font-size: 14px; color: #0F172A;">${name}</strong>
            ${statusMessage ? `<p style="margin: 4px 0 0; font-size: 12px; color: #64748B;">${statusMessage}</p>` : ''}
            <p style="margin: 4px 0 0; font-size: 11px; color: #94A3B8;">${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        // Update existing map and marker
        mapRef.current.panTo(coords);
        if (markerRef.current) {
          markerRef.current.setLngLat(coords);
        }
      }
    } catch (err: any) {
      console.warn('Mapbox initialization error:', err);
      setMapError(err?.message || 'Failed to initialize Mapbox map');
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coords ? `${coords[0]},${coords[1]}` : null, isOn, color]);

  if (!coords) {
    return (
      <div
        className={`${className} bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-slate-500`}
      >
        <MapPin className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
        <p className="text-sm font-medium">No geocoordinates set for {name}</p>
        <p className="text-xs text-slate-400 mt-1">Location will appear here once configured</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className={`${className} bg-slate-100 border border-slate-300 flex flex-col items-center justify-center p-6 text-slate-600`}
      >
        <MapPin className="w-8 h-8 text-amber-500 mb-2" />
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-slate-500 mt-1">
          Coordinates: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded shadow text-xs font-mono text-slate-700 pointer-events-none">
        📍 {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
      </div>
    </div>
  );
};
