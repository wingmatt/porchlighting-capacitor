<template>
  <div v-if="supported" class="notification-settings">
    <ion-button fill="clear" :disabled="busy" :aria-pressed="enabled" @click="toggleNotifications">
      <AssetSvg asset="moth.svg"  :style="{marginRight: '.33em', width: '1.33em'}" />
      {{ enabled ? 'Moth Alert: On' : 'Moth Alert: Off' }}
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonButton } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { configureNativeNotifications, disableNotifications, requestNotificationPermission } from '../notifications';
import AssetSvg from "./AssetSvg.vue";

const enabled = ref(false);
const message = ref('');
const showInfo = ref(false);
const busy = ref(false);
const supported = Capacitor.isNativePlatform() || ('Notification' in window);

onMounted(async () => {
  try {
    const preference = await Preferences.get({ key: 'notifications_enabled' });
    let subscriptionExists = true;
    if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration('/');
      subscriptionExists = Boolean(await registration?.pushManager.getSubscription());
    }
    enabled.value = preference.value === 'true' && subscriptionExists;
    await configureNativeNotifications();
  } catch {
    message.value = 'Native notifications could not be initialized.';
  }
});

const toggleNotifications = async () => {
  message.value = '';
  busy.value = true;
  try {
    if (enabled.value) {
      await disableNotifications();
      enabled.value = false;
      message.value = 'Notifications disabled.';
    } else {
      const granted = await requestNotificationPermission();
      enabled.value = granted;
      message.value = granted ? 'Notifications enabled.' : 'Notification permission was not granted.';
    }
  } catch {
    message.value = `Notifications could not be ${enabled.value ? 'disabled' : 'enabled'}. Check your connection and try again.`;
  } finally {
    busy.value = false;
  }
};
</script>

<style scoped>
.notification-settings { display: flex; align-items: center; gap: .33rem; flex-wrap: wrap; }
.notification-settings small { color: var(--muted-text-color); }
</style>