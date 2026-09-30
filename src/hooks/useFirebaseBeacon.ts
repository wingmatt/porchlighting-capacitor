import { useState, useEffect } from 'preact/hooks';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Beacon } from '../types';

export function useFirebaseBeacon(initialBeacon: Beacon) {
  const [beacon, setBeacon] = useState<Beacon>(initialBeacon);

  useEffect(() => {
    if (!initialBeacon?.id) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Listen to porchlights collection broadcast from PostgreSQL
    const docRef = doc(firestore, 'porchlights', String(initialBeacon.id));
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBeacon((prev) => ({
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
          rsvp_count: data.rsvp_count ?? prev.rsvp_count,
        }));
      }
    });

    return () => unsub();
  }, [initialBeacon.id]);

  return [beacon, setBeacon] as const;
}
