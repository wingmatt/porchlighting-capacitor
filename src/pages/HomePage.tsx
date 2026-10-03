import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Link } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import { PorchlightCarousel } from '../components/PorchlightCarousel';
import { PorchlightList } from '../components/PorchlightList';
import { Beacon } from '../types';
import styles from './HomePage.module.css';

const editableRoles = new Set(['OWNER', 'ADMIN', 'EDIT', 'SHARE']);

export const HomePage: FunctionComponent = () => {
  const { user, loading: authLoading } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [guestReady, setGuestReady] = useState(false);
  const [accessiblePorchlights, setAccessiblePorchlights] = useState<Beacon[]>([]);
  const [editablePorchlights, setEditablePorchlights] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const updatePorchlight = useCallback((updated: Beacon) => {
    setAccessiblePorchlights((current) => current.map((porchlight) => porchlight.id === updated.id ? updated : porchlight));
    setEditablePorchlights((current) => current.map((porchlight) => porchlight.id === updated.id ? updated : porchlight));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    const loadHome = async () => {
      const [{ value: token }, { value: name }] = await Promise.all([
        Preferences.get({ key: 'guestToken' }),
        Preferences.get({ key: 'guestName' }),
      ]);
      if (cancelled) return;
      setGuestName(name || '');
      setGuestReady(!user && Boolean(token));

      if (!user && !token) {
        setAccessiblePorchlights([]);
        setEditablePorchlights([]);
        setLoading(false);
        return;
      }

      try {
        const accessibleRequest = apiClient.get('/neighborhood/');
        const responses = user
          ? await Promise.all([accessibleRequest, apiClient.get('/porchlights/')])
          : [await accessibleRequest];
        if (cancelled) return;
        const accessible = responses[0].data as Beacon[];
        setAccessiblePorchlights(accessible);
        if (user) {
          setEditablePorchlights((responses[1].data as Beacon[]).filter((porchlight) => (
            porchlight.is_owner || editableRoles.has(String(porchlight.user_role || '').toUpperCase())
          )));
        } else {
          setEditablePorchlights([]);
        }
      } catch {
        if (!cancelled) setError('Unable to load your porchlights right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHome();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  if (authLoading || loading) return <p>Loading porchlights...</p>;
  if (error) return <p role="alert">{error}</p>;
  const litCount = accessiblePorchlights.filter((porchlight) => porchlight.is_on).length;
  if (!user && !guestReady) return (
    <div className={styles.homeStack}>
      <section className={styles.card}>
        <h1>Welcome to Porchlighting</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</p>
        <div className={styles.actions}>
          <Link className={styles.button} to="/login">Log in</Link>
          <Link className={styles.secondaryButton} to="/register">Sign up</Link>
        </div>
      </section>
    </div>
  );

  if (!user) {
    return (
      <div className={styles.homeStack}>
        <section className={styles.card}>
          <h1>Hello, {guestName || 'guest'}!</h1>
          <h2>{litCount} lit porchlights</h2>
          <PorchlightList porchlights={accessiblePorchlights} onUpdate={updatePorchlight} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.homeStack}>
      <section className={styles.card}>
        <h1>Welcome back{user.first_name ? `, ${user.first_name}` : ''}!</h1>
        <h2>Porchlights you can edit</h2>
        <PorchlightCarousel porchlights={editablePorchlights} onUpdate={updatePorchlight} />
      </section>
      <section className={styles.card}>
        <h2>{litCount} lit porchlights</h2>
        <PorchlightList porchlights={accessiblePorchlights} onUpdate={updatePorchlight} />
      </section>
    </div>
  );
};