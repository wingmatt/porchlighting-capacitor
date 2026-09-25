import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Preferences } from '@capacitor/preferences';
import { Beacon, Invitation } from '../types';
import { MapboxMap } from '../components/MapboxMap';
import styles from './InvitationPage.module.css';

export const InvitationPage: FunctionComponent = () => {
  const { sqid } = useParams<{ sqid: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ invitation: Invitation; beacon: Beacon; accepted: boolean } | null>(null);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (sqid) {
      apiClient.get(`/join/${sqid}/`).then((res) => setData(res.data));
    }
  }, [sqid]);

  const handleJoin = async (guestSignup = false) => {
    if (!data) return;

    const payload: Record<string, any> = {
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

  if (!data) return <div className={styles.loading}>Loading invitation...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {data.accepted ? `You're part of ${data.beacon.name}` : `Welcome to ${data.beacon.name}`}
        </h2>
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

        {!data.accepted && (
          <div className={styles.joinForm}>
            <input
              type="text"
              placeholder="Your Name (Guest)"
              value={guestName}
              onInput={(e) => setGuestName((e.target as HTMLInputElement).value)}
              className={styles.input}
            />
            <button
              onClick={() => handleJoin(true)}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              Join Beacon
            </button>
          </div>
        )}

        {data.accepted && (
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
