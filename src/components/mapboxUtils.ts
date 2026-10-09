import type { Beacon, GeoJSONPoint } from '../types';

export interface MapboxMapMarker {
  location: GeoJSONPoint | [number, number];
  name?: string;
  statusMessage?: string;
  description?: string;
  isOn?: boolean;
  color?: string;
  rsvpBeacon?: Beacon;
}

export function extractLngLat(location?: GeoJSONPoint | [number, number] | null): [number, number] | null {
  if (!location) return null;
  if (Array.isArray(location) && location.length === 2) {
    const lng = Number(location[0]);
    const lat = Number(location[1]);
    return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90 ? [lng, lat] : null;
  }
  if (location.type === 'Point' && Array.isArray(location.coordinates)) return extractLngLat(location.coordinates);
  return null;
}