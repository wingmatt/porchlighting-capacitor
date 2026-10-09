<template>
  <div v-if="!displayCoords" :class="[className, styles.emptyState]"><p :class="styles.emptyTitle">No geocoordinates set for {{ name }}</p><p :class="styles.emptyDescription">Location will appear here once configured</p></div>
  <div v-else-if="mapError" :class="[className, styles.errorState]"><p :class="styles.errorTitle">{{ name }}</p><p :class="styles.errorDescription">Coordinates: {{ displayCoords[1].toFixed(5) }}, {{ displayCoords[0].toFixed(5) }}</p></div>
  <div v-else :class="[styles.wrapper, className]"><div ref="mapContainer" :class="[styles.mapContainer, theme === 'dark' ? styles.darkMap : '']" /><div :class="styles.coordinates">📍 {{ displayCoords[1].toFixed(4) }}, {{ displayCoords[0].toFixed(4) }}</div></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { GeoJSONPoint } from '../types';
import { extractLngLat, type MapboxMapMarker } from './mapboxUtils';
import styles from './MapboxMap.module.css';
import { useTheme } from '../contexts/Theme';

const props = withDefaults(defineProps<{
  location?: GeoJSONPoint | [number, number] | null;
  markers?: MapboxMapMarker[];
  defaultLocation?: [number, number];
  name?: string;
  statusMessage?: string;
  isOn?: boolean;
  color?: string;
  zoom?: number;
  interactive?: boolean;
  draggable?: boolean;
  onCoordinatesChange?: (location: GeoJSONPoint) => void;
  className?: string;
}>(), { name: 'Porchlight', color: '#F59E0B', zoom: 14, interactive: true, draggable: false, className: '' });

const { theme } = useTheme();
const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markerInstances = ref<any[]>([]);
const mapError = ref<string | null>(null);
const normalizedMarkers = computed(() => (props.markers?.length ? props.markers : props.location || props.defaultLocation ? [{ location: props.location || props.defaultLocation!, name: props.name, statusMessage: props.statusMessage, isOn: props.isOn, color: props.color }] : []).map((marker) => ({ ...marker, coordinates: extractLngLat(marker.location) })).filter((marker): marker is MapboxMapMarker & { coordinates: [number, number] } => Boolean(marker.coordinates)));
const displayCoords = computed(() => extractLngLat(props.location) || props.defaultLocation || normalizedMarkers.value[0]?.coordinates || null);
const markerKey = computed(() => normalizedMarkers.value.map((marker) => `${marker.coordinates.join(',')}:${marker.name}:${marker.statusMessage}:${marker.isOn}:${marker.rsvpBeacon?.rsvp_count}`).join('|'));

const clearMap = () => { markerInstances.value.forEach((marker) => marker.remove()); markerInstances.value = []; mapInstance.value?.remove(); mapInstance.value = null; };
const initializeMap = async () => {
  clearMap();
  mapError.value = null;
  if (!mapContainer.value || !normalizedMarkers.value.length) return;
  try {
    const [{ default: mapboxgl }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    const first = normalizedMarkers.value[0].coordinates;
    const map = new mapboxgl.Map({ container: mapContainer.value, style: `mapbox://styles/mapbox/${theme.value === 'dark' ? 'dark-v11' : 'streets-v12'}`, center: first, zoom: props.zoom, interactive: props.interactive });
    if (props.interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapInstance.value = map;
    markerInstances.value = normalizedMarkers.value.map((item) => {
      const element = document.createElement('div'); element.className = `${styles.marker} ${item.isOn === false ? '' : styles.markerLit}`; element.textContent = '●'; element.style.color = item.color || props.color;
      const popupContent = document.createElement('div'); popupContent.style.fontFamily = 'sans-serif'; popupContent.innerHTML = `<strong>${item.name || 'Porchlight'}</strong>${item.statusMessage ? `<p>${item.statusMessage}</p>` : ''}${item.description ? `<p>${item.description}</p>` : ''}`;
      const marker = new mapboxgl.Marker({ element, draggable: Boolean(props.draggable && !props.markers?.length) }).setLngLat(item.coordinates).setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent)).addTo(map);
      if (props.draggable && !props.markers?.length) marker.on('dragend', () => { const position = marker.getLngLat(); props.onCoordinatesChange?.({ type: 'Point', coordinates: [position.lng, position.lat] }); });
      return marker;
    });
    if (normalizedMarkers.value.length > 1) { const bounds = new mapboxgl.LngLatBounds(first, first); normalizedMarkers.value.slice(1).forEach((item) => bounds.extend(item.coordinates)); map.fitBounds(bounds, { padding: 48, maxZoom: props.zoom }); }
  } catch (error) { console.warn('Mapbox initialization error:', error); mapError.value = error instanceof Error ? error.message : 'Failed to initialize Mapbox map'; }
};
watch([markerKey, () => theme.value], initializeMap, { immediate: true });
onBeforeUnmount(clearMap);
</script>