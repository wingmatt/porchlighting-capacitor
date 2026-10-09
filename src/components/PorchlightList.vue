<template>
  <template v-if="displayPorchlights.length === 0"><p v-if="reducedMotion" :class="styles.refreshNote" role="status">Reduced-motion mode is active. Refresh this page manually to see updates.</p><p>{{ emptyMessage }}</p></template>
  <template v-else-if="locatedPorchlights.length === 0"><porchlight-list-item v-for="porchlight in displayPorchlights" :key="porchlight.id" :porchlight="porchlight" @update="updatePorchlight" /></template>
  <div v-else :class="styles.container">
    <p v-if="reducedMotion" :class="styles.refreshNote" role="status">Reduced-motion mode is active. Refresh this page manually to see updates.</p>
    <ion-segment v-model="activeTab" :class="styles.tabs" aria-label="Porchlight display">
      <ion-segment-button value="all">All <beacon-graphic :is-on="anyPorchlightOn" :class="styles.statusIcon" /></ion-segment-button>
      <ion-segment-button value="map">Map <beacon-graphic :is-on="anyLocatedPorchlightOn" :class="styles.statusIcon" /></ion-segment-button>
    </ion-segment>
    <div v-if="activeTab === 'all'" :class="styles.panel"><porchlight-list-item v-for="porchlight in displayPorchlights" :key="porchlight.id" :porchlight="porchlight" @update="updatePorchlight" /></div>
    <div v-else :class="styles.mapList"><mapbox-map :markers="locatedPorchlights.map(toMarker)" :class="styles.map" /><div :class="styles.mapItems"><router-link v-for="porchlight in locatedPorchlights" :key="porchlight.id" :class="styles.mapTitle" :to="`/porchlight/${porchlight.sqid}`">{{ porchlight.name || 'Unnamed porchlight' }}</router-link></div></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonSegment, IonSegmentButton } from '@ionic/vue';
import type { Beacon } from '../types';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';
import BeaconGraphic from './BeaconGraphic.vue';
import MapboxMap from './MapboxMap.vue';
import type { MapboxMapMarker } from './mapboxUtils';
import PorchlightListItem from './PorchlightListItem.vue';
import styles from './PorchlightList.module.css';
const props = withDefaults(defineProps<{ porchlights: Beacon[]; emptyMessage?: string }>(), { emptyMessage: 'No porchlights yet.' });
const emit = defineEmits<{ update: [beacon: Beacon] }>();
const activeTab = ref<'all' | 'map'>('all');
const displayPorchlights = ref(props.porchlights);
const { reducedMotion } = useAccessibilityPreferences();
watch(() => props.porchlights, (value) => { displayPorchlights.value = value; });
const locatedPorchlights = computed(() => displayPorchlights.value.filter((item) => item.type === 'physical' && Boolean(item.location)));
const anyPorchlightOn = computed(() => displayPorchlights.value.some((item) => item.is_on));
const anyLocatedPorchlightOn = computed(() => locatedPorchlights.value.some((item) => item.is_on));
const updatePorchlight = (updated: Beacon) => { displayPorchlights.value = displayPorchlights.value.map((item) => item.id === updated.id ? updated : item); emit('update', updated); };
const toMarker = (item: Beacon): MapboxMapMarker => ({ location: item.location!, name: item.name, statusMessage: item.status_message, description: item.description, isOn: item.is_on, color: item.color, rsvpBeacon: item });
</script>