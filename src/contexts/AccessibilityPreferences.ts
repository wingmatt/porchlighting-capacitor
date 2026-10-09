import { inject, onMounted, provide, ref, type InjectionKey, type Ref } from 'vue';
import { Preferences } from '@capacitor/preferences';

const REDUCED_MOTION_KEY = 'reduced_motion';
const LIVE_UPDATES_KEY = 'live_updates';
export interface AccessibilityPreferencesValue {
  reducedMotion: Ref<boolean>;
  liveUpdates: Ref<boolean>;
  setReducedMotion: (enabled: boolean) => void;
  setLiveUpdates: (enabled: boolean) => void;
}
const PREFERENCES_KEY: InjectionKey<AccessibilityPreferencesValue> = Symbol('accessibility-preferences');

export function AccessibilityPreferencesProvider() {
  const reducedMotion = ref(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const liveUpdates = ref(true);
  const setReducedMotion = (enabled: boolean) => {
    reducedMotion.value = enabled;
    void Preferences.set({ key: REDUCED_MOTION_KEY, value: String(enabled) });
  };
  const setLiveUpdates = (enabled: boolean) => {
    liveUpdates.value = enabled;
    void Preferences.set({ key: LIVE_UPDATES_KEY, value: String(enabled) });
  };

  onMounted(async () => {
    const [motionPreference, liveUpdatesPreference] = await Promise.all([
      Preferences.get({ key: REDUCED_MOTION_KEY }),
      Preferences.get({ key: LIVE_UPDATES_KEY }),
    ]);
    if (motionPreference.value !== null) reducedMotion.value = motionPreference.value === 'true';
    if (liveUpdatesPreference.value !== null) liveUpdates.value = liveUpdatesPreference.value === 'true';
  });

  provide(PREFERENCES_KEY, { reducedMotion, liveUpdates, setReducedMotion, setLiveUpdates });
  return { reducedMotion, liveUpdates, setReducedMotion, setLiveUpdates };
}

export function useAccessibilityPreferences(): AccessibilityPreferencesValue {
  const preferences = inject(PREFERENCES_KEY);
  if (!preferences) throw new Error('useAccessibilityPreferences must be used within AccessibilityPreferencesProvider');
  return preferences;
}