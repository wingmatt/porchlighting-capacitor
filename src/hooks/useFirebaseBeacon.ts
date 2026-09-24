import { useState, useEffect } from 'preact/hooks';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Beacon } from '../types';

export function useFirebaseBeacon(initialBeacon: Beacon) {
  const [beacon, setBeacon] = useState<Beacon>(initialBeacon);

  useEffect(() => {
    if (!initialBeacon?.id) return;
    const unsub = onSnapshot(doc(firestore, 'beacons', String(initialBeacon.id)), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBeacon((prev) => ({
          ...prev,
          name: data.name ?? prev.name,
          type: data.type ?? prev.type,
          active_until: data.active_until ?? prev.active_until,
          location: data.location ?? prev.location,
          rsvp_count: data.rsvp_count ?? prev.rsvp_count,
        }));
      }
    });

    return () => unsub();
  }, [initialBeacon.id]);

  return [beacon, setBeacon] as const;
}
