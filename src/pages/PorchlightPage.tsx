import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Beacon } from '../types';
import { useFirebaseBeacon } from '../hooks/useFirebaseBeacon';
import { BeaconIcon } from '../components/BeaconIcon';
import { BeaconRsvpForm } from '../components/BeaconRsvpForm';
import { MapboxMap } from '../components/MapboxMap';
import styles from './PorchlightPage.module.css';

export const PorchlightPage: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const [initialBeacon, setInitialBeacon] = useState<Beacon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient
        .get(`/porchlight/${id}/`)
        .then((res) => {
          setInitialBeacon(res.data);
          setError(null);
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || 'Failed to load porchlight');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading porchlight details...</div>;
  }

  if (error || !initialBeacon) {
    return (
      <div className={styles.error}>
        {error || 'Porchlight not found'}
      </div>
    );
  }

  return <PorchlightLiveView initialBeacon={initialBeacon} />;
};

const PorchlightLiveView: FunctionComponent<{ initialBeacon: Beacon }> = ({ initialBeacon }) => {
  // Synchronized via Firebase Firestore broadcast from Postgres database
  const [beacon, setBeacon] = useFirebaseBeacon(initialBeacon);

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div>
          <h2 className={styles.title}>{beacon.name || 'Porchlight'}</h2>
          {beacon.status_message && (
            <p className={styles.statusMessage}>{beacon.status_message}</p>
          )}
          {beacon.description && (
            <p className={styles.description}>{beacon.description}</p>
          )}
        </div>
        <BeaconIcon
          beacon={beacon}
          editable={beacon.is_owner || beacon.user_role === 'OWNER' || beacon.user_role === 'ADMIN'}
          onUpdate={(updated) => setBeacon((prev) => ({ ...prev, ...updated }))}
        />
      </div>

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Location Map</h3>
        <MapboxMap
          location={beacon.location || beacon.coordinates}
          name={beacon.name}
          statusMessage={beacon.status_message}
          isOn={beacon.is_on}
          color={beacon.color || '#F59E0B'}
          className={styles.map}
        />
      </div>

      <div className={styles.rsvpCard}>
        <h3 className={styles.sectionTitle}>RSVP Status</h3>
        <BeaconRsvpForm beacon={beacon} />
      </div>
    </div>
  );
};
