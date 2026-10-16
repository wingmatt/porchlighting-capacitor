<template>
  <div v-if="!displayCoords" :class="[className, styles.emptyState]"><p :class="styles.emptyTitle">No geocoordinates set for {{ name }}</p><p :class="styles.emptyDescription">Location will appear here once configured</p></div>
  <div v-else-if="mapError" :class="[className, styles.errorState]"><p :class="styles.errorTitle">{{ name }}</p><p :class="styles.errorDescription">{{ mapError }}</p><p :class="styles.errorDescription">Coordinates: {{ displayCoords[1].toFixed(5) }}, {{ displayCoords[0].toFixed(5) }}</p></div>
  <div v-else :class="[styles.wrapper, className]"><div ref="mapContainer" :class="[styles.mapContainer, theme === 'dark' ? styles.darkMap : '']" /></div>
  <ion-modal
    :is-open="Boolean(selectedBeacon)"
    :initial-breakpoint="0.55"
    :breakpoints="[0, 0.55, 0.85]"
    @did-dismiss="closeBeaconDialog"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ selectedBeacon?.name || 'Porchlight' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Close beacon details" @click="closeBeaconDialog">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="selectedBeacon" :class="styles.dialogContent">
      <p v-if="selectedBeacon.description" :class="styles.dialogDescription">{{ selectedBeacon.description }}</p>
      <p v-else :class="styles.dialogDescription">This porchlight is lit and welcoming visitors.</p>
      <div :class="styles.dialogRsvp">
        <Rsvp :beacon="selectedBeacon" @update="updateSelectedBeacon" />
        <span>RSVP to this porchlight</span>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, createApp, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/vue';
import type { Beacon, GeoJSONPoint } from '../types';
import { extractLngLat, type MapboxMapMarker } from './mapboxUtils';
import styles from './MapboxMap.module.css';
import { useTheme } from '../contexts/Theme';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';
import BeaconIcon from './BeaconIcon.vue';
import Rsvp from './Rsvp.vue';

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
const { reducedMotion } = useAccessibilityPreferences();
const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markerInstances = ref<any[]>([]);
const markerApps = ref<ReturnType<typeof createApp>[]>([]);
const mapError = ref<string | null>(null);
const selectedBeacon = ref<Beacon | null>(null);
const normalizedMarkers = computed(() => (props.markers?.length ? props.markers : props.location || props.defaultLocation ? [{ location: props.location || props.defaultLocation!, name: props.name, statusMessage: props.statusMessage, isOn: props.isOn, color: props.color }] : []).map((marker) => ({ ...marker, coordinates: extractLngLat(marker.location) })).filter((marker): marker is MapboxMapMarker & { coordinates: [number, number] } => Boolean(marker.coordinates)));
const displayCoords = computed(() => extractLngLat(props.location) || props.defaultLocation || normalizedMarkers.value[0]?.coordinates || null);
const markerKey = computed(() => normalizedMarkers.value.map((marker) => `${marker.coordinates.join(',')}:${marker.name}:${marker.statusMessage}:${marker.isOn}:${marker.rsvpBeacon?.rsvp_count}`).join('|'));

const clearMap = () => {
  markerApps.value.forEach((app) => app.unmount());
  markerApps.value = [];
  markerInstances.value.forEach((marker) => marker.remove());
  markerInstances.value = [];
  mapInstance.value?.remove();
  mapInstance.value = null;
};
const closeBeaconDialog = () => { selectedBeacon.value = null; };
const updateSelectedBeacon = (updated: Partial<Beacon>) => {
  if (selectedBeacon.value) selectedBeacon.value = { ...selectedBeacon.value, ...updated };
};
const initializeMap = async () => {
  clearMap();
  mapError.value = null;
  if (!mapContainer.value || !normalizedMarkers.value.length) return;
  try {
    await nextTick();
    const { default: mapboxgl } = await import('mapbox-gl');
    const accessToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    if (!accessToken || !accessToken.startsWith('pk.')) {
      throw new Error('Mapbox access token is not configured. Set VITE_MAPBOX_TOKEN.');
    }
    mapboxgl.accessToken = accessToken;
    const first = normalizedMarkers.value[0].coordinates;
    const map = new mapboxgl.Map({ container: mapContainer.value, style: `mapbox://styles/mapbox/${theme.value === 'dark' ? 'dark-v11' : 'streets-v12'}`, center: first, zoom: props.zoom, interactive: props.interactive });
    map.on('error', (event: { error?: Error }) => {
      if (event.error) mapError.value = event.error.message;
    });
    map.on('load', () => map.resize());
    if (props.interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapInstance.value = map;
    markerInstances.value = normalizedMarkers.value.map((item) => {
      const element = document.createElement('div');
      element.className = `${styles.marker} ${item.isOn ? styles.markerLit : ''}`;
      const beacon = item.rsvpBeacon || {
        id: item.name || 'map-marker',
        name: item.name,
        location: { type: 'Point', coordinates: item.coordinates },
        is_on: item.isOn ?? false,
        color: item.color,
      };
      const beaconApp = createApp({ render: () => h(BeaconIcon, { beacon, editable: false, reducedMotion: reducedMotion.value }) });
      beaconApp.mount(element);
      markerApps.value.push(beaconApp);
      element.setAttribute('aria-label', item.name || 'Porchlight');
      element.addEventListener('click', () => {
        if (item.isOn ?? beacon.is_on) selectedBeacon.value = beacon;
      });
      const marker = new mapboxgl.Marker({ element, draggable: Boolean(props.draggable && !props.markers?.length) }).setLngLat(item.coordinates).addTo(map);
      if (props.draggable && !props.markers?.length) marker.on('dragend', () => { const position = marker.getLngLat(); props.onCoordinatesChange?.({ type: 'Point', coordinates: [position.lng, position.lat] }); });
      return marker;
    });
    if (normalizedMarkers.value.length > 1) { const bounds = new mapboxgl.LngLatBounds(first, first); normalizedMarkers.value.slice(1).forEach((item) => bounds.extend(item.coordinates)); map.fitBounds(bounds, { padding: 48, maxZoom: props.zoom }); }
  } catch (error) { console.warn('Mapbox initialization error:', error); mapError.value = error instanceof Error ? error.message : 'Failed to initialize Mapbox map'; }
};
watch([markerKey, () => theme.value], initializeMap, { immediate: true });
onMounted(initializeMap);
onBeforeUnmount(clearMap);
</script>