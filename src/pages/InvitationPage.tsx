import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Preferences } from '@capacitor/preferences';
import { Beacon, Invitation } from '../types';
import { MapboxMap } from '../components/MapboxMap';
import { useAuth } from '../auth';
import styles from './InvitationPage.module.css';

export const InvitationPage: FunctionComponent = () => {
  const { sqid } = useParams<{ sqid: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<{ invitation: Invitation; beacon: Beacon; has_permission: boolean } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sqid && !authLoading) {
      apiClient.get(`/invitations/validate/${sqid}/`)
        .then((res) => setData({ ...res.data, invitation: res.data, beacon: res.data.porchlight }))
        .catch(() => setError('This invitation could not be found.'));
    }
  }, [sqid, authLoading]);

  const handleJoin = async (guestSignup = false) => {
    if (!data) return;
    setError('');
    setSaving(true);

    try {
      if (guestSignup) {
        const response = await apiClient.post('/guest/access/', {
          invitation_code: sqid,
          guest_name: guestName,
        });
        await Preferences.set({ key: 'guestToken', value: response.data.guest_token });
        await Preferences.set({ key: 'guestName', value: response.data.guest_name });
      } else {
        await apiClient.post('/invitations/accept/', { code: sqid });
      }
      navigate(`/porchlight/${data.beacon.id}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || requestError?.response?.data?.error || 'Unable to accept this invitation.');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className={styles.loading}>Loading invitation...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {data.has_permission ? `You're part of ${data.beacon.name}` : `Invitation to ${data.beacon.name}`}
        </h2>
        {error && <p className={styles.error}>{error}</p>}
        {data.beacon.description && (
          <p className={styles.description}>{data.beacon.description}</p>
        )}

        {data.beacon.location && (
          <div className={styles.mapContainer}>
            <MapboxMap
              location={data.beacon.location || data.beacon.coordinates}
              name={data.beacon.name}
              isOn={data.beacon.is_on}
              color={data.beacon.color}
              className={styles.map}
            />
          </div>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && !data.invitation.is_guest && user && (
          <div className={styles.joinForm}>
            <button
              onClick={() => handleJoin()}
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={saving}
            >
              {saving ? 'Accepting...' : `Accept invitation as ${user.email}`}
            </button>
          </div>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && !data.invitation.is_guest && !user && (
          <div className={styles.joinForm}>
            <p className={styles.description}>Log in or register to accept this invitation.</p>
            <button onClick={() => navigate(`/login?next=/join/${sqid}`)} className={`${styles.button} ${styles.primaryButton}`}>
              Log in to accept
            </button>
          </div>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && data.invitation.is_guest && (
          <div className={styles.joinForm}>
            <input type="text" placeholder="Your Name (Guest)" value={guestName}
              onInput={(e) => setGuestName((e.target as HTMLInputElement).value)} className={styles.input} />
            <button onClick={() => handleJoin(true)} className={`${styles.button} ${styles.primaryButton}`} disabled={saving}>
              {saving ? 'Joining...' : 'Join Beacon'}
            </button>
          </div>
        )}

        {data.has_permission && (
          <button
            onClick={() => navigate(`/porchlight/${data.beacon.id}`)}
            className={`${styles.button} ${styles.darkButton}`}
          >
            View Porchlight
          </button>
        )}
      </div>
    </div>
  );
};
