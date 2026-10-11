<template>
  <button v-if="!enabled" type="button" :class="$style.addLocation" @click="enabled = true">Add location</button>
  <div v-else :class="$style.locationFields">
    <div :class="$style.locationControls">
      <LocationToggle
        label="Broadcast location"
        :checked="broadcastLocation"
        @change="emit('broadcastChange', $event)"
      />
      <button v-if="location" type="button" :class="$style.removeLocation" @click="removeLocation">
        Remove location
      </button>
    </div>
    <template v-if="!location">
      <p v-if="error">{{ error }}</p>
      <label>
        Street address
        <ion-input
          v-model="address.street"
          name="street-address"
          autocomplete="street-address"
          inputmode="text"
        />
      </label>
      <div :class="$style.addressRow">
        <label>
          City
          <ion-input v-model="address.city" name="address-level2" autocomplete="address-level2" />
        </label>
        <label>
          State
          <ion-input v-model="address.state" name="address-level1" autocomplete="address-level1" />
        </label>
        <label>
          ZIP code
          <ion-input
            v-model="address.postalCode"
            name="postal-code"
            autocomplete="postal-code"
            inputmode="numeric"
          />
        </label>
      </div>
      <button type="button" :disabled="geocoding" @click="useAddress">
        {{ geocoding ? 'Finding address...' : 'Use Address' }}
      </button>
    </template>
    <MapboxMap
      v-if="location"
      :location="location"
      :defaultLocation="[-98.5795, 39.8283]"
      :name="name || 'Porchlight'"
      draggable
      :on-coordinates-change="handleCoordinatesChange"
    />
    <p v-if="location" :class="$style.coordinates">
      Coordinates: {{ location.coordinates[1].toFixed(5) }}, {{ location.coordinates[0].toFixed(5) }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { IonInput } from '@ionic/vue';
import { apiClient } from '../api/client';
import type { GeoJSONPoint } from '../types';
import MapboxMap from './MapboxMap.vue';
import LocationToggle from './LocationToggle.vue';
const props = defineProps<{ location: GeoJSONPoint | null; name?: string; broadcastLocation: boolean }>();
const emit = defineEmits<{ change: [location: GeoJSONPoint | null]; broadcastChange: [broadcast: boolean] }>();
const enabled = ref(Boolean(props.location));
const address = reactive({ street: '', city: '', state: '', postalCode: '' });
const geocoding = ref(false);
const error = ref('');

const handleCoordinatesChange = (newLocation: GeoJSONPoint) => {
  emit('change', newLocation);
};

const useAddress = async () => {
  const formattedAddress = [address.street, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');

  if (!formattedAddress) {
    error.value = 'Enter an address before using it.';
    return;
  }

  error.value = '';
  geocoding.value = true;

  try {
    const response = await apiClient.post('/porchlights/geocode/', { address: formattedAddress });
    emit('change', response.data);
  } catch (requestError: unknown) {
    error.value = (requestError as { response?: { data?: { detail?: string } } })
      .response?.data?.detail || 'Unable to find that address.';
  } finally {
    geocoding.value = false;
  }
};

const removeLocation = () => {
  enabled.value = false;
  emit('change', null);
  emit('broadcastChange', false);
};
</script>
<style module src="./LocationEditor.module.css"></style>