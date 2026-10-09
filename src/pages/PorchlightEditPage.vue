<template>
  <ion-page>
    <ion-content>
      <p v-if="!porchlight && !error">Loading...</p>
      <div v-else class="page">
        <div class="card">
          <h1>Edit porchlight</h1>
          <p v-if="error" class="error">{{ error }}</p>
          <form v-if="porchlight" @submit.prevent="submit">
        <label>
          Name
          <ion-input v-model="name" required />
        </label>
        <label>
          Description
          <ion-textarea v-model="description" />
        </label>
        <LocationEditor
          :location="location"
          :name="name"
          :broadcast-location="broadcastLocation"
          @change="location = $event"
          @broadcast-change="broadcastLocation = $event"
        />
        <div class="actions">
          <router-link :to="`/porchlight/${porchlight.sqid || id}`">Cancel</router-link>
          <ion-button type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </ion-button>
        </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonButton, IonContent, IonInput, IonPage, IonTextarea } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import LocationEditor from '../components/LocationEditor.vue';
import type { Beacon, GeoJSONPoint } from '../types';

const route = useRoute();
const router = useRouter();
const id = String(route.params.id || '');
const porchlight = ref<Beacon | null>(null);
const name = ref('');
const broadcastLocation = ref(false);
const description = ref('');
const location = ref<GeoJSONPoint | null>(null);
const error = ref('');
const saving = ref(false);

onMounted(async () => {
  if (!id) return;
  try {
    const response = await apiClient.get(`/porchlights/${id}/`);
    const data = response.data as Beacon;
    porchlight.value = data;
    name.value = data.name || '';
    broadcastLocation.value = data.type === 'physical';
    description.value = data.description || '';
    location.value = data.location || null;
  } catch (requestError: any) {
    error.value = requestError?.response?.data?.detail || 'Unable to load porchlight.';
  }
});

const submit = async () => {
  if (!id) return;
  error.value = '';
  saving.value = true;
  try {
    const response = await apiClient.patch(`/porchlights/${id}/`, {
      name: name.value,
      type: broadcastLocation.value ? 'physical' : 'virtual',
      description: description.value,
      location: location.value,
    });
    await router.push(`/porchlight/${response.data.sqid || id}`);
  } catch (requestError: any) {
    const data = requestError?.response?.data;
    error.value = data?.name?.[0] || data?.detail || 'Unable to update porchlight.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
@import './PorchlightCreatePage.module.css';
</style>