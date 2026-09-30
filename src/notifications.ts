import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { apiClient } from './api/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY || '';
const NATIVE_TOKEN_KEY = 'notifications_native_token';
const WEB_ENDPOINT_KEY = 'notifications_web_endpoint';

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return false;
    await PushNotifications.register();
    return true;
  }

  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const json = subscription.toJSON();
  await apiClient.post('/auth/web-push/register/', {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  });
  if (json.endpoint) await Preferences.set({ key: WEB_ENDPOINT_KEY, value: json.endpoint });
  await Preferences.set({ key: 'notifications_enabled', value: 'true' });
  return true;
}

export async function disableNotifications(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const registrationToken = (await Preferences.get({ key: NATIVE_TOKEN_KEY })).value;
    if (registrationToken) {
      await apiClient.post('/auth/fcm/unregister/', { registration_token: registrationToken });
      await Preferences.remove({ key: NATIVE_TOKEN_KEY });
    }
  } else if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint || (await Preferences.get({ key: WEB_ENDPOINT_KEY })).value;
    if (endpoint) await apiClient.post('/auth/web-push/unregister/', { endpoint });
    await subscription?.unsubscribe();
    await Preferences.remove({ key: WEB_ENDPOINT_KEY });
  }
  await Preferences.remove({ key: 'notifications_enabled' });
}

export async function configureNativeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.addListener('registration', async (token) => {
    await Preferences.set({ key: NATIVE_TOKEN_KEY, value: token.value });
    await apiClient.post('/auth/fcm/register/', { registration_token: token.value, device_type: Capacitor.getPlatform() });
  });
  await PushNotifications.addListener('registrationError', (error) => console.error('Push registration failed', error));
}