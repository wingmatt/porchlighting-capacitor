<template>
  <div :class="$style.page">
    <div :class="$style.card">
      <h1>Neighborhood</h1>
      <p>Porchlights you own or can access.</p>
      <p v-if="loading">Loading Porchlights...</p>
      <p v-if="error" :class="$style.error">{{ error }}</p>
      <PorchlightList
        v-if="!loading && !error"
        :porchlights="porchlights"
        empty-message="No accessible Porchlights yet."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { apiClient } from '../api/client';
import PorchlightList from '../components/PorchlightList.vue';
import type { Beacon } from '../types';

const porchlights = ref<Beacon[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(() => {
  apiClient.get<Beacon[]>('/neighborhood/')
    .then((response) => { porchlights.value = response.data; })
    .catch(() => { error.value = 'Unable to load your neighborhood Porchlights.'; })
    .finally(() => { loading.value = false; });
});
</script>

<style module src="./NeighborhoodPage.module.css"></style>