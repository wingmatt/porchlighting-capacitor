import { useState, useEffect } from 'preact/hooks';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Beacon } from '../types';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';

export function useFirebaseBeacon(initialBeacon: Beacon) {
  const [beacon, setBeacon] = useState<Beacon>(initialBeacon);
  const { reducedMotion, liveUpdates } = useAccessibilityPreferences();

  useEffect(() => {
    if (!initialBeacon?.id) return;

    if (reducedMotion || !liveUpdates) return;
    
    // Listen to porchlights collection broadcast from PostgreSQL
    const docRef = doc(firestore, 'porchlights', String(initialBeacon.id));
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBeacon((prev) => {
          const incomingUpdatedAt = toTimestamp(data.updated_at);
          const currentUpdatedAt = toTimestamp(prev.updated_at);
          if (
            incomingUpdatedAt !== null &&
            currentUpdatedAt !== null &&
            incomingUpdatedAt < currentUpdatedAt
          ) {
            return prev;
          }
          return {
            ...prev,
            ...data,
            id: prev.id,
            name: data.name ?? prev.name,
            type: data.type ?? prev.type,
            active_until: data.active_until ?? prev.active_until,
            is_active: data.is_active ?? prev.is_active,
            location: data.location ?? prev.location,
            coordinates: data.coordinates ?? prev.coordinates,
            is_on: data.is_on ?? prev.is_on,
            brightness: data.brightness ?? prev.brightness,
            color: data.color ?? prev.color,
            status_message: data.status_message ?? prev.status_message,
            updated_at: data.updated_at ?? prev.updated_at,
            rsvp_count: data.rsvp_count ?? prev.rsvp_count,
          };
        });
      }
    });

    return () => unsub();
  }, [initialBeacon.id, reducedMotion, liveUpdates]);

  return [beacon, setBeacon] as const;
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
