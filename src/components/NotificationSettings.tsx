import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Info } from 'lucide-preact';
import { configureNativeNotifications, disableNotifications, requestNotificationPermission } from '../notifications';
import styles from './NotificationSettings.module.css';

export const NotificationSettings: FunctionComponent = () => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const restoreNotificationState = async () => {
      const preference = await Preferences.get({ key: 'notifications_enabled' });
      let subscriptionExists = true;
      if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration('/');
        subscriptionExists = Boolean(await registration?.pushManager.getSubscription());
      }
      setEnabled(preference.value === 'true' && subscriptionExists);
      await configureNativeNotifications();
    };

    restoreNotificationState().catch(() => setMessage('Native notifications could not be initialized.'));
  }, []);

  const toggleNotifications = async () => {
    setMessage('');
    setBusy(true);
    try {
      if (enabled) {
        await disableNotifications();
        setEnabled(false);
        setMessage('Notifications disabled.');
        return;
      }
      const granted = await requestNotificationPermission();
      setEnabled(granted);
      setMessage(granted ? 'Notifications enabled.' : 'Notification permission was not granted.');
    } catch {
      setMessage(`Notifications could not be ${enabled ? 'disabled' : 'enabled'}. Check your connection and try again.`);
    } finally {
      setBusy(false);
    }
  };

  const supported = Capacitor.isNativePlatform() || ('Notification' in window);
  if (!supported) return null;
  return <div className={styles.container}>
    <button type="button" className={styles.modeButton} onClick={toggleNotifications} disabled={busy} aria-pressed={enabled}>
      <span className={`${styles.icon} ${enabled ? styles.activeIcon : ''}`} aria-hidden="true" />
      {enabled ? 'Moth Mode On' : 'Moth Mode Off'}
    </button>
    <div className={styles.infoWrapper}>
      <button
        type="button"
        className={styles.infoButton}
        aria-label="About Moth Mode"
        aria-expanded={showInfo}
        aria-controls="moth-mode-explainer"
        onClick={() => setShowInfo(true)}
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        onFocus={() => setShowInfo(true)}
        onBlur={() => setShowInfo(false)}
      >
        <Info size={16} aria-hidden="true" />
      </button>
      {showInfo && <span id="moth-mode-explainer" className={styles.explainer}>Be the moth to their flame. Get a heads up when your friends turn their light on</span>}
    </div>
    {message && <small className={styles.message}>{message}</small>}
  </div>;
};