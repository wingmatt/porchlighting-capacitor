<template>
  <p v-if="loading">Loading...</p>
  <div v-else class="page">
    <div class="card">
      <h1>New porchlight</h1>
      <p v-if="error" class="error">{{ error }}</p>
      <form @submit.prevent="submit">
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
          <router-link to="/profile">Cancel</router-link>
          <ion-button type="submit" :disabled="saving">
            {{ saving ? 'Creating...' : 'Create porchlight' }}
          </ion-button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonButton, IonInput, IonTextarea } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import LocationEditor from '../components/LocationEditor.vue';
import type { GeoJSONPoint } from '../types';

const { user, loading } = useAuth();
const router = useRouter();
const name = ref('');
const broadcastLocation = ref(false);
const description = ref('');
const location = ref<GeoJSONPoint | null>(null);
const error = ref('');
const saving = ref(false);

watch([loading, user], ([isLoading, currentUser]) => {
  if (!isLoading && !currentUser) router.replace('/login');
}, { immediate: true });

const submit = async () => {
  error.value = '';
  saving.value = true;
  try {
    const response = await apiClient.post('/porchlights/', {
      name: name.value,
      type: broadcastLocation.value ? 'physical' : 'virtual',
      description: description.value,
      location: location.value,
    });
    await router.push(`/porchlight/${response.data.sqid}`);
  } catch (requestError: any) {
    const data = requestError?.response?.data;
    error.value = data?.name?.[0] || data?.detail || 'Unable to create porchlight.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
@import './PorchlightCreatePage.module.css';
</style>