<template>
  <p v-if="porchlights.length === 0">{{ emptyMessage }}</p>
  <div v-else :class="styles.container"><div :class="styles.track">
    <article v-for="porchlight in porchlights" :key="porchlight.id" :class="styles.card">
      <span :class="styles.name">{{ porchlight.name || 'Unnamed porchlight' }}</span>
      <beacon-icon :beacon="porchlight" :editable="canEditBeacon(porchlight)" @update="onUpdate" />
      <router-link :class="styles.editButton" :to="`/porchlight/${porchlight.sqid}/edit`">Edit</router-link>
    </article>
  </div></div>
</template>

<script setup lang="ts">
import type { Beacon } from '../types';
import BeaconIcon, { canEditBeacon } from './BeaconIcon.vue';
import styles from './PorchlightCarousel.module.css';
defineProps<{ porchlights: Beacon[]; emptyMessage?: string }>();
const emit = defineEmits<{ update: [beacon: Beacon] }>();
const onUpdate = (beacon: Beacon) => emit('update', beacon);
</script>