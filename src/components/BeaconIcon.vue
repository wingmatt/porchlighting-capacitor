<template>
  <button :class="[$style.button, isActive ? $style.active : $style.inactive]" :disabled="!editable || saving" :aria-busy="saving" :aria-label="isActive ? 'Turn off beacon' : 'Turn on beacon'" @click="handleToggle">
    <span :class="$style.iconWrapper"><BeaconGraphic :isOn="isActive" :className="`${$style.icon} brightness-${currentBeacon.brightness ?? 100}`" :label="isActive ? 'Lit porchlight' : 'Unlit porchlight'" />
      <span v-if="(currentBeacon.rsvp_count ?? 0) > 0" :class="[$style.rsvpBadge, currentBeacon.has_rsvp ? $style.rsvpBadgeSelected : '']" :aria-label="`Porchlight has at least one RSVP${currentBeacon.has_rsvp ? ', including you' : ''}`"><AssetSvg asset="moth.svg" :className="$style.rsvpIcon" /></span>
    </span>
  </button>
</template>
<script lang="ts">
import type { Beacon } from '../types';
const editableRoles = new Set(['OWNER', 'ADMIN', 'EDIT', 'SHARE']);
export const canEditBeacon = (beacon: Beacon) => Boolean(beacon.is_owner) || editableRoles.has(String(beacon.user_role || '').toUpperCase());
</script>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { apiClient } from '../api/client';
import type { Beacon } from '../types';
import AssetSvg from './AssetSvg.vue';
import BeaconGraphic from './BeaconGraphic.vue';
const props = withDefaults(defineProps<{ beacon: Beacon; editable?: boolean }>(), { editable: false });
const emit = defineEmits<{ update: [updated: Beacon] }>();
const currentBeacon = ref(props.beacon); const saving = ref(false);
watch(() => props.beacon, (beacon) => { currentBeacon.value = beacon; });
const isActive = computed(() => currentBeacon.value.is_on ?? Boolean(currentBeacon.value.active_until && new Date(currentBeacon.value.active_until) > new Date()));
const handleToggle = async (event: MouseEvent) => {
  if (!props.editable) return; event.preventDefault(); event.stopPropagation(); saving.value = true;
  try { const response = await apiClient.post(`/porchlights/${props.beacon.sqid}/control/`, { action: 'toggle' }); if (response.data?.porchlight) { currentBeacon.value = response.data.porchlight; emit('update', response.data.porchlight); } }
  finally { saving.value = false; }
};
</script>
<style module src="./BeaconIcon.module.css"></style>