<template>
  <ion-page>
    <ion-content>
      <article :class="$style.page">
        <header :class="$style.intro">
          <h1>Moth Alert</h1>
          <p>
            Moth Alert lets you know when a Porchlight you can access lights up. It is a handy nudge
            when you are nearby and might want to stop by.
          </p>
        </header>

        <section :class="$style.card" aria-labelledby="moth-status-title">
          <div :class="$style.statusRow">
            <div>
              <h2 id="moth-status-title">Moth Alert is {{ enabled ? 'on' : 'off' }}</h2>
              <p v-if="enabled">We will let you know when an accessible Porchlight lights up.</p>
              <p v-else>Turn it on if you would like to hear about new porchlight activity.</p>
            </div>
            <ion-badge :color="enabled ? 'success' : 'medium'">{{ enabled ? 'On' : 'Off' }}</ion-badge>
          </div>
          <ion-button expand="block" :disabled="busy || permissionStatus === 'denied' || permissionStatus === 'unsupported'" @click="toggleMothAlert">
                      <AssetSvg asset="moth.svg" :className="$style.moth" label="Moth" />
 {{ busy ? 'One moment…' : enabled ? 'Turn Moth Alert off' : 'Turn Moth Alert on' }}
          </ion-button>
          <p v-if="message" :class="$style.message" role="status">{{ message }}</p>
        </section>

        <section v-if="permissionStatus === 'denied'" :class="[$style.card, $style.notice]" aria-labelledby="blocked-title">
          <h2 id="blocked-title">Notifications are blocked</h2>
          <p>
            Your {{ isNative ? 'app' : 'browser' }} is currently not allowed to send notifications, so Moth Alert
            cannot reach you yet.
          </p>
          <p v-if="isNative">
            Open your device Settings, find Porchlighting, choose Notifications, and allow them. Then come back
            here and try again.
          </p>
          <p v-else>
            Open this site's settings from your browser's address bar, change Notifications to Allow, and reload
            this page. The exact wording varies a little by browser.
          </p>
        </section>

      </article>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonBadge, IonButton, IonContent, IonPage } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import AssetSvg from '../components/AssetSvg.vue';
import {
  configureNativeNotifications,
  disableNotifications,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '../notifications';

const enabled = ref(false);
const busy = ref(false);
const message = ref('');
const permissionStatus = ref<NotificationPermissionStatus>('prompt');
const isNative = Capacitor.isNativePlatform();

const hasWebSubscription = async (): Promise<boolean> => {
  if (isNative || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return Boolean(await registration?.pushManager.getSubscription());
};

onMounted(async () => {
  try {
    permissionStatus.value = await getNotificationPermissionStatus();
    const preference = await Preferences.get({ key: 'notifications_enabled' });
    enabled.value = preference.value === 'true' && permissionStatus.value === 'granted'
      && (isNative || await hasWebSubscription());
    await configureNativeNotifications();
  } catch {
    message.value = 'We could not check notification settings right now. Please try again.';
  }
});

const toggleMothAlert = async () => {
  busy.value = true;
  message.value = '';
  try {
    if (enabled.value) {
      await disableNotifications();
      enabled.value = false;
      message.value = 'Moth Alert is off.';
      return;
    }
    permissionStatus.value = await getNotificationPermissionStatus();
    if (permissionStatus.value === 'denied') return;
    const granted = await requestNotificationPermission();
    permissionStatus.value = await getNotificationPermissionStatus();
    enabled.value = granted;
    message.value = granted
      ? 'Moth Alert is on. We will let you know when a Porchlight lights up.'
      : permissionStatus.value === 'denied'
        ? 'Notifications are blocked. Follow the steps below to unblock them.'
        : 'Notifications were not turned on.';
  } catch {
    message.value = 'We could not turn Moth Alert on right now. Please try again.';
  } finally {
    busy.value = false;
  }
};
</script>

<style module src="./MothAlertPage.module.css"></style>
