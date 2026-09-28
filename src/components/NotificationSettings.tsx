import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Capacitor } from '@capacitor/core';
import { configureNativeNotifications, requestNotificationPermission } from '../notifications';
import styles from './NotificationSettings.module.css';

export const NotificationSettings: FunctionComponent = () => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    configureNativeNotifications().catch(() => setMessage('Native notifications could not be initialized.'));
  }, []);

  const enable = async () => {
    setMessage('');
    try {
      const granted = await requestNotificationPermission();
      setEnabled(granted);
      setMessage(granted ? 'Notifications enabled.' : 'Notification permission was not granted.');
    } catch {
      setMessage('Notifications could not be enabled. Check your connection and try again.');
    }
  };

  const supported = Capacitor.isNativePlatform() || ('Notification' in window);
  if (!supported) return null;
  return <div className={styles.container}>
    <div><strong>Go Porchlighting</strong><p>Be the moth to their flame. Get a heads up when your friends turn their light on</p></div>
    <button type="button" onClick={enable} disabled={enabled}>{enabled ? 'Enabled' : 'Enable'}</button>
    {message && <small>{message}</small>}
  </div>;
};