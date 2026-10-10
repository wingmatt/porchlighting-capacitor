<template>
  <div :class="$style.item">
    <BeaconIcon :beacon="porchlight" :editable="canEdit" @update="emit('update', $event)" />
    <RouterLink :class="$style.name" :to="`/porchlight/${porchlight.sqid}`">
      <span>{{ porchlight.name || 'Unnamed porchlight' }}</span>
      <span
        v-if="canEdit"
        :class="$style.permissionIndicator"
        title="You can edit this porchlight"
        aria-label="You can edit this porchlight"
      >✦</span>
    </RouterLink>
    <Rsvp :beacon="porchlight" @update="handleRsvpUpdate" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Beacon } from '../types';
import BeaconIcon, { canEditBeacon } from './BeaconIcon.vue';
import Rsvp from './Rsvp.vue';
const props = defineProps<{ porchlight: Beacon }>();
const emit = defineEmits<{ update: [updated: Beacon] }>();
const canEdit = computed(() => canEditBeacon(props.porchlight));

const handleRsvpUpdate = (updated: Partial<Beacon>) => {
  emit('update', { ...props.porchlight, ...updated });
};
</script>
<style module src="./PorchlightListItem.module.css"></style>