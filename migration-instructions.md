### Frontend Recreation: CapacitorJS & React

#### 1. Setup Capacitor & React App
Create a Vite Preact + TypeScript project and configure Capacitor:

```bash
npm create vite@latest porchlighting-mobile -- --template react-ts
cd porchlighting-mobile
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/preferences
npm install firebase lucide-react clsx tailwindcss @tailwindcss/vite axios react-router-dom
npx cap init Porchlighting com.porchlighting.app
```

Configure `src/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
```

---

#### 2. API Client with Guest & Auth Token Interceptors
In `src/api/client.ts`:
```typescript
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

apiClient.interceptors.request.use(async (config) => {
  const authToken = (await Preferences.get({ key: 'auth_token' })).value;
  const guestToken = (await Preferences.get({ key: 'guestToken' })).value;
  const guestName = (await Preferences.get({ key: 'guestName' })).value;

  if (authToken) {
    config.headers.Authorization = `Token ${authToken}`;
  }
  if (guestToken) {
    config.headers['X-Guest-Token'] = guestToken;
  }
  if (guestName) {
    config.headers['X-Guest-Name'] = guestName;
  }
  return config;
});
```

---

#### 3. Real-time Firebase React Hook
Replace Laravel Echo's `useEchoModel` with a Firestore document snapshot hook:

```typescript
// src/hooks/useFirebaseBeacon.ts
import { useState, useEffect } from 'react';
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
```

---

#### 4. Component Conversions (Vue 3 -> React)

##### `BeaconIcon.tsx` (Toggle On/Off)
```tsx
import React from 'react';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Lightbulb } from 'lucide-react';

interface Props {
  beacon: Beacon;
  editable?: boolean;
  onUpdate?: (updated: Beacon) => void;
}

export const BeaconIcon: React.FC<Props> = ({ beacon, editable, onUpdate }) => {
  const isActive = beacon.active_until && new Date(beacon.active_until) > new Date();

  const handleToggle = async (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    const response = await apiClient.patch(`/porchlight/${beacon.id}/update/`, {
      active: !isActive,
    });
    if (onUpdate && response.data) {
      onUpdate(response.data);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!editable}
      className={`p-3 rounded-full transition-colors ${
        isActive ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-300/50' : 'bg-slate-200 text-slate-400'
      }`}
      aria-label={isActive ? 'Turn off beacon' : 'Turn on beacon'}
    >
      <Lightbulb className="w-8 h-8" />
    </button>
  );
};
```

##### `BeaconRsvpForm.tsx` (Optimistic & Real-time RSVP)
```tsx
import React, { useState } from 'react';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Check, HelpCircle } from 'lucide-react';

interface Props {
  beacon: Beacon;
}

export const BeaconRsvpForm: React.FC<Props> = ({ beacon }) => {
  const [hasRsvp, setHasRsvp] = useState<string | null>(beacon.has_rsvp || null);
  const [rsvpCount, setRsvpCount] = useState<number>(beacon.rsvp_count || 0);

  const submitRsvp = async (type: 'yes' | 'maybe' | null) => {
    const nextType = hasRsvp === type ? null : type;
    
    // Optimistic UI update
    setRsvpCount((prev) => (nextType === 'yes' ? prev + 1 : hasRsvp === 'yes' ? prev - 1 : prev));
    setHasRsvp(nextType);

    await apiClient.post('/rsvp/', {
      beacon_id: beacon.id,
      type: nextType,
    });
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => submitRsvp('yes')}
        className={`px-3 py-1 rounded-md flex items-center gap-1 ${
          hasRsvp === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Check className="w-4 h-4" /> I'm In ({rsvpCount})
      </button>
      <button
        onClick={() => submitRsvp('maybe')}
        className={`px-3 py-1 rounded-md flex items-center gap-1 ${
          hasRsvp === 'maybe' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <HelpCircle className="w-4 h-4" /> Maybe
      </button>
    </div>
  );
};
```

##### `InvitationPage.tsx` (`Invitation.vue` equivalent)
```tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Preferences } from '@capacitor/preferences';
import { Beacon, Invitation } from '../types';

export const InvitationPage: React.FC = () => {
  const { sqid } = useParams<{ sqid: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ invitation: Invitation; beacon: Beacon; accepted: boolean } | null>(null);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    apiClient.get(`/join/${sqid}/`).then((res) => setData(res.data));
  }, [sqid]);

  const handleJoin = async (guestSignup = false) => {
    if (!data) return;

    let payload: Record<string, any> = {
      role: data.invitation.role_granted,
      from_invitation: data.invitation.id,
      beacon_id: data.invitation.beacon_id,
    };

    if (guestSignup) {
      const guestId = crypto.randomUUID();
      await Preferences.set({ key: 'guestToken', value: guestId });
      await Preferences.set({ key: 'guestName', value: guestName });
      payload.guest_id = guestId;
      payload.guest_name = guestName;
    }

    await apiClient.post(`/add/${sqid}/`, payload);
    navigate(`/porchlight/${data.beacon.id}`);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">
        {data.accepted ? `You're part of ${data.beacon.name}` : `Welcome to ${data.beacon.name}`}
      </h2>

      {!data.accepted && (
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Your Name (Guest)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            onClick={() => handleJoin(true)}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          >
            Join Beacon
          </button>
        </div>
      )}
    </div>
  );
};
```

---

### Native Build & Deployment Steps

1. **Build Frontend**:
   ```bash
   npm run build
   ```

2. **Sync with Capacitor Native Platforms**:
   ```bash
   npx cap add ios
   npx cap add android
   npx cap sync
   ```

3. **Open Platform in Native IDE**:
   ```bash
   npx cap open ios      # Opens Xcode
   npx cap open android  # Opens Android Studio
   ```

4. **Run Live on Emulator/Device**:
   ```bash
   npx cap run ios
   npx cap run android
   ```

---