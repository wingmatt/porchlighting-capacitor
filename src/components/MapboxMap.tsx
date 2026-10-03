import { FunctionComponent, render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Map as MapboxMapInstance, Marker as MapboxMarker } from 'mapbox-gl';
import { Beacon, LocationCoordinates } from '../types';
import { BEACON_LIT_ICON_URL, BEACON_UNLIT_ICON_URL } from '../constants';
import { MapPin } from 'lucide-preact';
import { Rsvp } from './Rsvp';
import styles from './MapboxMap.module.css';

interface MapboxMapProps {
  location?: string | LocationCoordinates | [number, number] | null;
  markers?: MapboxMapMarker[];
  defaultLocation?: [number, number];
  name?: string;
  statusMessage?: string;
  isOn?: boolean;
  color?: string;
  zoom?: number;
  interactive?: boolean;
  draggable?: boolean;
  onCoordinatesChange?: (coordinates: { latitude: number; longitude: number }) => void;
  className?: string;
}

export interface MapboxMapMarker {
  location: string | LocationCoordinates | [number, number];
  name?: string;
  statusMessage?: string;
  description?: string;
  isOn?: boolean;
  color?: string;
  rsvpBeacon?: Beacon;
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
  markers,
  defaultLocation,
  name = 'Porchlight',
  statusMessage,
  isOn = true,
  color = '#F59E0B',
  zoom = 14,
  interactive = true,
  draggable = false,
  onCoordinatesChange,
  className = styles.defaultMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMapInstance | null>(null);
  const markerRefs = useRef<MapboxMarker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const coordinatesChangeRef = useRef(onCoordinatesChange);
  coordinatesChangeRef.current = onCoordinatesChange;

  const coords = extractLngLat(location) ?? defaultLocation ?? null;
  const markerData = (markers?.length ? markers : location || defaultLocation ? [{ location: location || defaultLocation!, name, statusMessage, isOn, color }] : [])
    .map((marker) => ({ ...marker, coordinates: extractLngLat(marker.location) }))
    .filter((marker): marker is typeof marker & { coordinates: [number, number] } => Boolean(marker.coordinates));
  const markerKey = markerData.map((marker) => `${marker.coordinates.join(',')}:${marker.name}:${marker.statusMessage}:${marker.description}:${marker.isOn}:${marker.color}:${marker.rsvpBeacon?.has_rsvp}:${marker.rsvpBeacon?.rsvp_count}:${marker.rsvpBeacon?.rsvp_id}`).join('|');
  const displayCoords = coords ?? markerData[0]?.coordinates ?? null;

  useEffect(() => {
    if (!mapContainerRef.current || markerData.length === 0) return;

    let cancelled = false;

    const initializeMap = async () => {
      const [{ default: mapboxgl }] = await Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ]);

      if (cancelled || !mapContainerRef.current) return;

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
            center: markerData[0].coordinates,
            zoom: zoom,
            interactive: interactive,
          });

          // Add standard navigation controls if interactive
          if (interactive) {
            map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
          }

          mapRef.current = map;
          markerRefs.current = markerData.map((markerDataItem) => {
            const markerIsOn = markerDataItem.isOn ?? true;
            const markerCoordinates = markerDataItem.coordinates;
            const el = document.createElement('div');
            el.className = `${styles.marker} ${markerIsOn ? styles.markerLit : ''}`;
            const icon = document.createElement('div');
            icon.className = `${styles.markerIcon} ${markerIsOn ? styles.markerIconLit : styles.markerIconUnlit}`;
            icon.setAttribute('role', 'img');
            icon.setAttribute('aria-label', markerIsOn ? 'Lit porchlight' : 'Unlit porchlight');
            const iconUrl = markerIsOn ? BEACON_LIT_ICON_URL : BEACON_UNLIT_ICON_URL;
            icon.style.setProperty('mask-image', `url(${iconUrl})`);
            icon.style.setProperty('-webkit-mask-image', `url(${iconUrl})`);
            el.appendChild(icon);
            el.style.cursor = 'pointer';

            const popupContent = document.createElement('div');
            popupContent.style.fontFamily = 'sans-serif';
            popupContent.style.padding = '4px';

            const title = document.createElement('strong');
            title.textContent = markerDataItem.name || 'Porchlight';
            title.style.fontSize = '14px';
            title.style.color = '#0F172A';
            popupContent.appendChild(title);

            if (markerDataItem.statusMessage) {
              const status = document.createElement('p');
              status.textContent = markerDataItem.statusMessage;
              status.style.margin = '4px 0 0';
              status.style.fontSize = '12px';
              status.style.color = '#64748B';
              popupContent.appendChild(status);
            }

            if (markerDataItem.description) {
              const description = document.createElement('p');
              description.textContent = markerDataItem.description;
              description.style.margin = '4px 0 0';
              description.style.fontSize = '12px';
              description.style.color = '#64748B';
              popupContent.appendChild(description);
            }

            if (markerDataItem.rsvpBeacon) {
              const rsvpContainer = document.createElement('div');
              popupContent.appendChild(rsvpContainer);
              render(<Rsvp beacon={markerDataItem.rsvpBeacon} />, rsvpContainer);
            }

            const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);

            return new mapboxgl.Marker({ element: el, draggable: markers?.length ? false : draggable })
              .setLngLat(markerCoordinates)
              .setPopup(popup)
              .addTo(map);
          });

          if (markerData.length > 1) {
            const bounds = new mapboxgl.LngLatBounds(markerData[0].coordinates, markerData[0].coordinates);
            markerData.slice(1).forEach((markerDataItem) => bounds.extend(markerDataItem.coordinates));
            map.fitBounds(bounds, { padding: 48, maxZoom: zoom });
          }
        } else {
          // Update existing map and marker
          mapRef.current.panTo(markerData[0].coordinates);
          markerRefs.current.forEach((marker, index) => marker.setLngLat(markerData[index].coordinates));
        }
      } catch (err: any) {
        console.warn('Mapbox initialization error:', err);
        setMapError(err?.message || 'Failed to initialize Mapbox map');
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [markerKey, zoom, interactive, draggable]);

  if (!displayCoords) {
    return (
      <div
        className={`${className} ${styles.emptyState}`}
      >
        <MapPin className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>No geocoordinates set for {name}</p>
        <p className={styles.emptyDescription}>Location will appear here once configured</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className={`${className} ${styles.errorState}`}
      >
        <MapPin className={styles.errorIcon} />
        <p className={styles.errorTitle}>{name}</p>
        <p className={styles.errorDescription}>
          Coordinates: {displayCoords[1].toFixed(5)}, {displayCoords[0].toFixed(5)}
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div ref={mapContainerRef} className={styles.mapContainer} />
      <div className={styles.coordinates}>
        📍 {displayCoords[1].toFixed(4)}, {displayCoords[0].toFixed(4)}
      </div>
    </div>
  );
};
