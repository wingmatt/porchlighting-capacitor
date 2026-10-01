import { createContext, FunctionComponent, ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { Preferences } from '@capacitor/preferences';

const REDUCED_MOTION_KEY = 'reduced_motion';
const LIVE_UPDATES_KEY = 'live_updates';

interface AccessibilityPreferencesValue {
  reducedMotion: boolean;
  liveUpdates: boolean;
  setReducedMotion: (enabled: boolean) => void;
  setLiveUpdates: (enabled: boolean) => void;
}

const AccessibilityPreferencesContext = createContext<AccessibilityPreferencesValue | null>(null);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const AccessibilityPreferencesProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const [reducedMotion, setReducedMotionState] = useState(prefersReducedMotion);
  const [liveUpdates, setLiveUpdatesState] = useState(true);

  useEffect(() => {
    Promise.all([
      Preferences.get({ key: REDUCED_MOTION_KEY }),
      Preferences.get({ key: LIVE_UPDATES_KEY }),
    ]).then(([motionPreference, liveUpdatesPreference]) => {
      if (motionPreference.value !== null) setReducedMotionState(motionPreference.value === 'true');
      if (liveUpdatesPreference.value !== null) setLiveUpdatesState(liveUpdatesPreference.value === 'true');
    });
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduced-motion', reducedMotion);
  }, [reducedMotion]);

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    void Preferences.set({ key: REDUCED_MOTION_KEY, value: String(enabled) });
  };

  const setLiveUpdates = (enabled: boolean) => {
    setLiveUpdatesState(enabled);
    void Preferences.set({ key: LIVE_UPDATES_KEY, value: String(enabled) });
  };

  return (
    <AccessibilityPreferencesContext.Provider value={{ reducedMotion, liveUpdates, setReducedMotion, setLiveUpdates }}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
};

export const useAccessibilityPreferences = () => {
  const preferences = useContext(AccessibilityPreferencesContext);
  if (!preferences) throw new Error('useAccessibilityPreferences must be used within AccessibilityPreferencesProvider');
  return preferences;
};