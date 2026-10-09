<template><div v-if="beacon.is_on" :class="$style.form"><button type="button" :disabled="saving" :aria-pressed="hasRsvp" :aria-busy="saving" :class="[$style.button, hasRsvp ? $style.yesSelected : $style.unselected]" @click="toggleRsvp"><AssetSvg asset="moth.svg" :className="`${$style.icon} ${hasRsvp ? $style.activeIcon : ''}`" /></button></div></template>
<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '../api/client';
import type { Beacon } from '../types';
import AssetSvg from './AssetSvg.vue';
const props = defineProps<{ beacon: Beacon }>(); const emit = defineEmits<{ update: [updated: Partial<Beacon>] }>();
const hasRsvp = ref(Boolean(props.beacon.has_rsvp)); const rsvpCount = ref(props.beacon.rsvp_count || 0); const rsvpId = ref<string | null>(props.beacon.rsvp_id || null); const saving = ref(false);
const toggleRsvp = async (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); if (saving.value) return; const nextHasRsvp = !hasRsvp.value; saving.value = true; hasRsvp.value = nextHasRsvp; rsvpCount.value += nextHasRsvp ? 1 : -1; try { if (nextHasRsvp) { const response = await apiClient.post('/rsvps/', { porchlight: props.beacon.id }); rsvpId.value = response.data.id; emit('update', { has_rsvp: true, rsvp_count: rsvpCount.value, rsvp_id: response.data.id }); } else if (rsvpId.value) { await apiClient.delete(`/rsvps/${rsvpId.value}/`); rsvpId.value = null; emit('update', { has_rsvp: false, rsvp_count: rsvpCount.value, rsvp_id: null }); } } catch { hasRsvp.value = !nextHasRsvp; rsvpCount.value -= nextHasRsvp ? 1 : -1; } finally { saving.value = false; } };
</script>
<style module src="./Rsvp.module.css"></style>