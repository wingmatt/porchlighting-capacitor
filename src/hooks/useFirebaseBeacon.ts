import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Beacon } from '../types';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';

export function useFirebaseBeacon(initialBeacon: Ref<Beacon | null>) {
  const beacon = ref<Beacon>(initialBeacon.value as Beacon);
  const { reducedMotion, liveUpdates } = useAccessibilityPreferences();
  let unsubscribe: (() => void) | undefined;

  const stopListening = () => {
    unsubscribe?.();
    unsubscribe = undefined;
  };

  const startListening = () => {
    stopListening();
    if (!initialBeacon.value?.id || reducedMotion.value || !liveUpdates.value) return;
    // Listen to porchlights collection broadcast from PostgreSQL
    const docRef = doc(firestore, 'porchlights', String(initialBeacon.value.id));
    unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const previous = beacon.value;
        const incomingUpdatedAt = toTimestamp(data.updated_at);
        const currentUpdatedAt = toTimestamp(previous.updated_at);
        if (incomingUpdatedAt !== null && currentUpdatedAt !== null && incomingUpdatedAt < currentUpdatedAt) return;
        beacon.value = {
          ...previous,
          ...data,
          id: previous.id,
          name: data.name ?? previous.name,
          type: data.type ?? previous.type,
          active_until: data.active_until ?? previous.active_until,
          is_active: data.is_active ?? previous.is_active,
          location: data.location ?? previous.location,
          is_on: data.is_on ?? previous.is_on,
          brightness: data.brightness ?? previous.brightness,
          color: data.color ?? previous.color,
          status_message: data.status_message ?? previous.status_message,
          updated_at: data.updated_at ?? previous.updated_at,
          rsvp_count: data.rsvp_count ?? previous.rsvp_count,
        };
      }
    });
  };

  watch([initialBeacon, () => reducedMotion.value, () => liveUpdates.value], ([nextBeacon]) => {
    if (nextBeacon) beacon.value = nextBeacon;
    startListening();
  }, { immediate: true });
  onBeforeUnmount(stopListening);

  return { beacon, setBeacon: (value: Beacon | ((current: Beacon) => Beacon)) => {
    beacon.value = typeof value === 'function' ? value(beacon.value) : value;
  }};
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date ? date.getTime() : null;
  }
  return null;
}
